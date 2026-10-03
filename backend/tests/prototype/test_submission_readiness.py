import hashlib
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event, select, func
from app.main import app
from app.models.report import Report
from app.models.analysis import Analysis
from app.schemas.report import ReportResponse
from app.services.report_service import create_report, get_reports
from app.services.analysis_service import analyze_report
from app.services.dashboard_service import get_dashboard_summary
from app.services.pattern_service import detect_emerging_patterns
from app.services.vector_service import find_similar_reports
import app.api.v1.reports as routes

TEXT = "Site: REGRESSION-RIG\nA worker nearly struck by a suspended load after the exclusion zone was bypassed. No injury occurred."
CSV = b'site,text,is_synthetic\nA,Worker nearly struck by suspended load A,true\nB,Worker nearly struck by suspended load B,true\nC,Worker nearly struck by suspended load C,true\n'

def count(db):
    return db.scalar(select(func.count(Report.id)))

def test_report_list_has_bounded_queries_and_detached_serialization(db):
    for n in range(40):
        report = create_report(db, f"{TEXT} {n}", "REGRESSION", commit=False)
        analyze_report(db, report, commit=False)
    db.commit()
    db.expunge_all()
    statements=[]
    def track(*args): statements.append(args[2])
    event.listen(db.get_bind(), "before_cursor_execute", track)
    reports = get_reports(db)
    db.expunge_all()
    result=[ReportResponse.model_validate(r).model_dump() for r in reports]
    event.remove(db.get_bind(), "before_cursor_execute", track)
    assert len(result)==40
    assert len(statements)==2
    assert all(item['analysis'] for item in result)
    assert all('embedding' not in item['metadata'] for item in result)

def test_single_submission_idempotency_and_mismatched_retry(db):
    client=TestClient(app)
    payload={'text':TEXT, 'request_id':str(uuid4()), 'is_synthetic':True}
    first=client.post('/api/v1/reports/analyze',json=payload)
    again=client.post('/api/v1/reports/analyze',json=payload)
    assert first.status_code==again.status_code==201
    assert first.json()['report_id']==again.json()['report_id']
    assert count(db)==1
    assert client.post('/api/v1/reports/analyze',json={**payload,'text':'Changed content'}).status_code==409
    stored=client.get('/api/v1/reports').json()
    assert stored[0]['is_synthetic'] is True
    assert stored[0]['analysis']['sif_level']==first.json()['risk_level']

def test_single_analysis_failure_rolls_back_report(db,monkeypatch):
    def fail(*a,**kw): raise RuntimeError('injected analysis failure')
    monkeypatch.setattr(routes,'analyze_report',fail)
    response=TestClient(app,raise_server_exceptions=False).post('/api/v1/reports/analyze',json={'text':TEXT})
    assert response.status_code==500
    assert count(db)==0

def upload(client):
    return client.post('/api/v1/reports/upload',files={'file':('tiny.csv',CSV,'text/csv')})

def test_csv_batch_retry_and_row_based_dashboard(db):
    client=TestClient(app)
    first=upload(client);again=upload(client)
    assert first.status_code==again.status_code==201
    assert first.json()['created']==3
    assert again.json()['created']==0 and again.json()['duplicate']
    assert [r['report_id'] for r in first.json()['reports']]==[r['report_id'] for r in again.json()['reports']]
    summary=get_dashboard_summary(db)
    assert summary['total_reports']==3
    assert sum(item['count'] for item in summary['sif_breakdown'])==3
    for site in summary['highest_risk_locations']:
        assert site['level']=='MEDIUM'
    patterns=detect_emerging_patterns(db)
    assert all(p['affected_site_count']==3 for p in patterns)

def test_csv_analysis_failure_rolls_back_entire_batch(db,monkeypatch):
    original=routes.analyze_report
    calls=0
    def fail_second(*a,**kw):
        nonlocal calls
        calls+=1
        if calls==2: raise RuntimeError('injected second-row failure')
        return original(*a,**kw)
    monkeypatch.setattr(routes,'analyze_report',fail_second)
    assert upload(TestClient(app,raise_server_exceptions=False)).status_code==500
    assert count(db)==0
    monkeypatch.setattr(routes,'analyze_report',original)
    assert upload(TestClient(app)).json()['created']==3

def test_legacy_partial_csv_batch_is_resumed(db):
    create_report(db,'Worker nearly struck by suspended load A','A',metadata={
        'upload_hash':hashlib.sha256(CSV).hexdigest(),'upload_batch_id':'legacy-partial'})
    response=upload(TestClient(app))
    assert response.status_code==201
    assert response.json()['created']==2 and response.json()['analyzed']==3
    assert count(db)==3

def test_embeddings_persist_and_similarity_enforces_threshold(db):
    first=create_report(db,'alpha beta gamma','A')
    second=create_report(db,'alpha beta gamma','B')
    unrelated=create_report(db,'unrelated office housekeeping','C')
    ids=[r.id for r in [first,second,unrelated]]
    db.expunge_all()
    assert len(db.get(Report,ids[0]).metadata_['embedding'])==384
    matches=find_similar_reports(db,ids[0])
    assert [r.id for r,score in matches]==[ids[1]]
    assert all(score>=0.75 for r,score in matches)
