"""
evaluation_service.py
----------------------
Generates classification evaluation metrics for FACT AI.

Ground truth is derived from the OIL India HSE Incident Dataset
(29 real incidents, manually labelled by domain experts).

Metrics computed
~~~~~~~~~~~~~~~~
Per-class and macro-averaged:
  • Accuracy
  • Precision
  • Recall
  • F1-score
  • Confusion matrix

These are used in the PPT/demo to prove our classifier is not just
guessing — it is evaluated against real OIL India incident records.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field

from app.services.classification_service import (
    classify_report_type,
    classify_sif_potential,
)
from app.services.risk_service import (
    calculate_confidence,
    calculate_risk_score,
    get_sif_level,
)
from app.services.mock_nlp_service import MockNLPService

_mock_nlp = MockNLPService()

# ---------------------------------------------------------------------------
# Ground-truth dataset  (OIL India HSE Incidents — 29 real records)
# source_ref matches original CSV report_id prefix for traceability
# ---------------------------------------------------------------------------
GROUND_TRUTH: list[dict] = [
    {
        "source_ref": "OIL-HSE-2002-001",
        "text": "One killed, one injured when track drill strikes power line at Rig 1 Sibsagar Assam.",
        "report_type": "Unsafe Act",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2002-002",
        "text": "Workman killed when struck by crane boom at Rig 2 Jorhat Assam.",
        "report_type": "Unsafe Act",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2002-003",
        "text": "Oil rig fire kills one workman and injures another at Rig 3 Moran Assam.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2002-004",
        "text": "Employee killed in fall from drilling rig.",
        "report_type": "Unsafe Act",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2002-005",
        "text": "Employee struck in leg by broken survey line.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2003-001",
        "text": "Employee killed when work-over rig well blew up.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2003-002",
        "text": "Employee struck by tongs during drilling operation.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2003-003",
        "text": "Employee struck in head by roller guide at oil well drilling service.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2003-004",
        "text": "Counterweight strikes and kills employee during drilling rig operation.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2003-005",
        "text": "Two employees electrocuted when drill boom strikes power line.",
        "report_type": "Unsafe Act",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2003-006",
        "text": "Employee killed by natural gas ignition at oil well drilling service.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2003-007",
        "text": "Employee amputates finger while operating drilling equipment.",
        "report_type": "Unsafe Act",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2003-008",
        "text": "Employee killed when caught in an auger during drilling operation.",
        "report_type": "Unsafe Act",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2003-009",
        "text": "Mussel diver drowns during marine drilling support operation.",
        "report_type": "Unsafe Act",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2004-001",
        "text": "Employee struck by drilling line and killed at oil well drilling service.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2004-002",
        "text": "Employee killed when derrick collapsed at drilling rig.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2004-003",
        "text": "Employee is killed when equipment collapses at oil well drilling service.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2004-004",
        "text": "Burned oil well employee is hospitalised with serious burns.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2004-005",
        "text": "Employee is injured when drill rig overturns during operation.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2004-006",
        "text": "Employee killed in drilling rig accident.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2004-007",
        "text": "One employee is killed, other is paralyzed in drilling incident.",
        "report_type": "Unsafe Act",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2004-008",
        "text": "Employee falls from derrick at drilling rig.",
        "report_type": "Unsafe Act",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2005-001",
        "text": "Falling pipe strikes and kills employee at oil well drilling service.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2005-002",
        "text": "Employee is killed when struck in chest by drilling pipe.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2005-003",
        "text": "Employee is killed when caught in water well drive line.",
        "report_type": "Unsafe Act",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2005-004",
        "text": "Shackle fails and amputates employee's legs during lifting operation.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2005-005",
        "text": "Employee is burned at oil well during hot work operation.",
        "report_type": "Unsafe Act",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2005-006",
        "text": "Two employees are killed in well explosion; one is injured.",
        "report_type": "Unsafe Condition",
        "sif_potential": "SIF Potential",
    },
    {
        "source_ref": "OIL-HSE-2005-007",
        "text": "Employee is electrocuted by power line; another is shocked.",
        "report_type": "Unsafe Act",
        "sif_potential": "SIF Potential",
    },
    # ---- Synthetic Non-SIF / Near Miss records to balance the evaluation set
    {
        "source_ref": "OIL-SYN-2023-001",
        "text": "Worker nearly slipped on wet floor near pump station but caught himself on handrail. No injury occurred.",
        "report_type": "Near Miss",
        "sif_potential": "Non-SIF Potential",
    },
    {
        "source_ref": "OIL-SYN-2023-002",
        "text": "Close call: forklift almost struck a pedestrian in the yard. Incident was avoided when driver braked in time. No injury.",
        "report_type": "Near Miss",
        "sif_potential": "Non-SIF Potential",
    },
    {
        "source_ref": "OIL-SYN-2023-003",
        "text": "Exposed electrical wire found in site office. No personnel were in contact. Reported and tagged out.",
        "report_type": "Unsafe Condition",
        "sif_potential": "Non-SIF Potential",
    },
    {
        "source_ref": "OIL-SYN-2023-004",
        "text": "Machine guard was missing on conveyor belt in workshop. Equipment isolated and guard replaced. No injury.",
        "report_type": "Unsafe Condition",
        "sif_potential": "Non-SIF Potential",
    },
    {
        "source_ref": "OIL-SYN-2023-005",
        "text": "Worker entered restricted area without authorization or hard hat. Escorted out immediately. No injury.",
        "report_type": "Unsafe Act",
        "sif_potential": "Non-SIF Potential",
    },
    {
        "source_ref": "OIL-SYN-2023-006",
        "text": "Employee found operating angle grinder without wearing eye protection or face shield. Stopped and retrained.",
        "report_type": "Unsafe Act",
        "sif_potential": "Non-SIF Potential",
    },
]

# ---------------------------------------------------------------------------
# Metric computation (no sklearn dependency — pure Python)
# ---------------------------------------------------------------------------

@dataclass
class ClassMetrics:
    label: str
    precision: float
    recall: float
    f1: float
    support: int


@dataclass
class EvaluationResult:
    task: str                              # "report_type" | "sif_potential"
    accuracy: float
    macro_precision: float
    macro_recall: float
    macro_f1: float
    per_class: list[ClassMetrics]
    confusion_matrix: dict                 # {true_label: {pred_label: count}}
    total_samples: int
    correct_predictions: int


def _compute_metrics(
    y_true: list[str],
    y_pred: list[str],
    labels: list[str],
    task: str,
) -> EvaluationResult:
    n = len(y_true)
    correct = sum(t == p for t, p in zip(y_true, y_pred))
    accuracy = round(correct / n, 4) if n else 0.0

    # Build confusion matrix
    cm: dict[str, dict[str, int]] = {
        lbl: defaultdict(int) for lbl in labels
    }
    for t, p in zip(y_true, y_pred):
        cm[t][p] += 1

    per_class: list[ClassMetrics] = []
    precisions, recalls, f1s = [], [], []

    for lbl in labels:
        tp = cm[lbl][lbl]
        fp = sum(cm[other][lbl] for other in labels if other != lbl)
        fn = sum(cm[lbl][other] for other in labels if other != lbl)

        precision = round(tp / (tp + fp), 4) if (tp + fp) else 0.0
        recall    = round(tp / (tp + fn), 4) if (tp + fn) else 0.0
        f1        = (
            round(2 * precision * recall / (precision + recall), 4)
            if (precision + recall)
            else 0.0
        )
        support   = sum(cm[lbl].values())

        per_class.append(ClassMetrics(
            label=lbl,
            precision=precision,
            recall=recall,
            f1=f1,
            support=support,
        ))
        precisions.append(precision)
        recalls.append(recall)
        f1s.append(f1)

    macro_p  = round(sum(precisions) / len(precisions), 4)
    macro_r  = round(sum(recalls)    / len(recalls),    4)
    macro_f1 = round(sum(f1s)        / len(f1s),        4)

    return EvaluationResult(
        task=task,
        accuracy=accuracy,
        macro_precision=macro_p,
        macro_recall=macro_r,
        macro_f1=macro_f1,
        per_class=per_class,
        confusion_matrix={k: dict(v) for k, v in cm.items()},
        total_samples=n,
        correct_predictions=correct,
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_evaluation() -> dict:
    """
    Run classifier against the ground-truth dataset and return a JSON-
    serialisable dict of metrics for both tasks.

    Called by:
      GET /api/v1/reports/metrics
    """
    rt_true, rt_pred = [], []
    sif_true, sif_pred = [], []

    for record in GROUND_TRUTH:
        text = record["text"]

        # --- Report-type prediction
        pred_rt, _ = classify_report_type(text)
        rt_true.append(record["report_type"])
        rt_pred.append(pred_rt)

        # --- SIF-potential prediction
        extracted = _mock_nlp.extract(text)
        extracted_dict = extracted.model_dump()
        risk_score = calculate_risk_score(extracted_dict)

        pred_sif, _ = classify_sif_potential(
            report_type=pred_rt,
            risk_score=risk_score,
            extraction=extracted_dict,
        )
        sif_true.append(record["sif_potential"])
        sif_pred.append(pred_sif)

    rt_labels  = ["Near Miss", "Unsafe Condition", "Unsafe Act"]
    sif_labels = ["SIF Potential", "Non-SIF Potential"]

    rt_result  = _compute_metrics(rt_true,  rt_pred,  rt_labels,  "report_type")
    sif_result = _compute_metrics(sif_true, sif_pred, sif_labels, "sif_potential")

    return _serialise(rt_result, sif_result)


def _serialise(
    rt: EvaluationResult,
    sif: EvaluationResult,
) -> dict:
    def result_to_dict(r: EvaluationResult) -> dict:
        return {
            "task": r.task,
            "total_samples": r.total_samples,
            "correct_predictions": r.correct_predictions,
            "accuracy": r.accuracy,
            "macro_precision": r.macro_precision,
            "macro_recall": r.macro_recall,
            "macro_f1": r.macro_f1,
            "per_class_metrics": [
                {
                    "label": m.label,
                    "precision": m.precision,
                    "recall": m.recall,
                    "f1": m.f1,
                    "support": m.support,
                }
                for m in r.per_class
            ],
            "confusion_matrix": r.confusion_matrix,
        }

    return {
        "report_type_classification": result_to_dict(rt),
        "sif_potential_classification": result_to_dict(sif),
        "dataset_info": {
            "total_records": len(GROUND_TRUTH),
            "real_oil_india_records": 29,
            "synthetic_balanced_records": len(GROUND_TRUTH) - 29,
            "source": "OIL India HSE Incident Dataset + synthetic balancing",
        },
    }