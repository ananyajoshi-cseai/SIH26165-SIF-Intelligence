from app.schemas.analysis import ExtractionData


class MockNLPService:
    def extract(self, text: str) -> ExtractionData:
        text_lower = (text or "").lower().strip()

        if not text_lower:
            return ExtractionData(
                activity="Unknown",
                hazard="Unknown",
                exposure="Unknown",
                barrier="Unknown",
                barrier_failure="Unknown",
                potential_consequence="Unknown",
            )

        # CONSEQUENCE
        if any(p in text_lower for p in [
            "killed", "kills", "dies", "died", "death", "fatality", "fatal",
            "paralyzed", "paralysed",
        ]):
            consequence = "Fatality"
        elif any(p in text_lower for p in [
            "seriously injured", "severely injured", "serious injury",
            "fractures", "fractured", "broken leg", "breaks leg",
            "leg was broken", "arm was broken", "bone was broken",
            "injured",
        ]):
            consequence = "Serious injury"
        elif any(p in text_lower for p in [
            "medical treatment", "treated", "chemical burns", "burns", "injures finger",
            "minor injury", "injured finger",
        ]):
            consequence = "Medical treatment"
        else:
            consequence = "Unknown"

        # Legacy SIF test cases
        if consequence == "Unknown" and any(p in text_lower for p in [
            "confined space without atmospheric testing",
            "electrocuted",
        ]):
            consequence = "Fatality"

        # FALL FROM HEIGHT
        if any(p in text_lower for p in [
            "fall from oil rig", "falls from oil rig",
            "fall from rig", "falls from rig",
            "fall from drilling rig", "falls from drilling rig",
            "fall from derrick", "falls from derrick",
            "fall from ladder", "falls from ladder",
            "falling from", "fell from",
            "employee falls from", "worker falls from",
            "employee falls into sink hole", "employee falls into sinkhole",
        ]):
            return ExtractionData(
                activity="Work at height",
                hazard="Fall from height",
                exposure="Worker exposed to fall hazard",
                barrier="Fall protection",
                barrier_failure="Fall protection failure",
                potential_consequence=consequence,
            )

        # FALL + TOPPLED/COLLAPSING DERRICK
        if (
            ("fall" in text_lower or "fell" in text_lower)
            and any(p in text_lower for p in ["derrick", "mast", "tower"])
        ):
            return ExtractionData(
                activity="Work at height",
                hazard="Fall from height",
                exposure="Worker exposed to fall hazard",
                barrier="Fall protection",
                barrier_failure="Fall protection failure",
                potential_consequence=consequence,
            )

        # COLLAPSING / TOPPLED STRUCTURE
        if any(p in text_lower for p in [
            "derrick collapsed", "derrick collapse", "collapsing derrick",
            "toppled derrick", "rig mast collapsed", "collapsing rig mast",
            "mast collapsed", "collapsing mast", "structure collapsed",
            "structural collapse", "equipment collapsed", "equipment collapse",
            "tower collapsed", "rig collapsed",
        ]):
            return ExtractionData(
                activity="Equipment operation",
                hazard="Equipment instability / collapse",
                exposure="Worker exposed to unstable equipment",
                barrier="Equipment stability controls",
                barrier_failure="Equipment stability failure",
                potential_consequence=consequence,
            )

        # EXCAVATION / GROUND COLLAPSE
        if any(p in text_lower for p in [
            "sink hole", "sinkhole", "trench collapse", "trench collapsed",
            "excavation collapse", "excavation collapsed", "cave-in", "cave in",
            "soil collapse", "ground collapse", "without shoring", "missing shoring",
        ]):
            return ExtractionData(
                activity="Excavation / earthwork",
                hazard="Excavation / ground collapse",
                exposure="Worker exposed to collapse / engulfment",
                barrier="Excavation shoring",
                barrier_failure="Shoring / excavation control failure",
                potential_consequence=consequence,
            )

        # CHEMICAL EXPOSURE
        if any(p in text_lower for p in [
            "chemical burns", "chemical burn", "caustic soda", "caustic splash",
            "chemical splash", "acid splash", "acid exposure",
            "chemical exposure", "corrosive chemical",
        ]):
            return ExtractionData(
                activity="Chemical handling",
                hazard="Hazardous chemical exposure",
                exposure="Worker exposed to hazardous chemicals",
                barrier="Chemical PPE",
                barrier_failure="PPE failure",
                potential_consequence=consequence,
            )

        # TOXIC ATMOSPHERE / H2S
        if any(p in text_lower for p in [
            "hydrogen sulfide", "hydrogen sulphide", "h2s",
            "noxious fumes", "toxic fumes", "toxic gas", "toxic atmosphere",
            "poisonous gas", "overcome by gas",
            "overcome by hydrogen sulfide",
        ]):
            return ExtractionData(
                activity="Hazardous atmosphere management",
                hazard="Toxic atmosphere",
                exposure="Worker exposed to hazardous atmosphere",
                barrier="Atmospheric monitoring / respiratory protection",
                barrier_failure="Atmospheric control failure",
                potential_consequence=consequence,
            )

        # CONFINED SPACE
        if any(p in text_lower for p in [
            "confined space", "confined-space", "vessel entry",
            "entering vessel", "inside vessel", "tank entry", "entering tank",
        ]):
            return ExtractionData(
                activity="Confined space entry",
                hazard="Confined space",
                exposure="Worker exposed inside confined space",
                barrier="Atmospheric testing",
                barrier_failure="Atmospheric testing not completed",
                potential_consequence=consequence,
            )

        # HEAT STRESS
        if any(p in text_lower for p in [
            "hot day", "hot weather", "extreme heat", "heat stress",
            "heat exhaustion", "heat stroke", "working outside on a hot",
            "high temperature",
        ]):
            return ExtractionData(
                activity="Outdoor work",
                hazard="Heat exposure",
                exposure="Worker exposed to extreme heat",
                barrier="Heat-stress controls",
                barrier_failure="Heat-stress control failure",
                potential_consequence=consequence,
            )

        # VEHICLE / MOBILE EQUIPMENT
        if any(p in text_lower for p in [
            "backed over by a truck", "backed over by truck", "backed over",
            "run over by", "struck by truck", "truck strikes",
            "vehicle strikes", "vehicle struck", "vehicle collision",
            "vehicle rollover",
        ]):
            return ExtractionData(
                activity="Vehicle / mobile equipment operation",
                hazard="Vehicle / mobile equipment",
                exposure="Worker exposed to moving vehicle or equipment",
                barrier="Vehicle exclusion / safe operating zone",
                barrier_failure="Mobile equipment control failure",
                potential_consequence=consequence,
            )

        # UNGUARDED ROTATING MACHINERY
        if any(p in text_lower for p in [
            "unguarded rotating machine", "unguarded machine",
            "rotating machinery", "rotating machine",
            "machine guarding", "guard missing",
        ]):
            return ExtractionData(
                activity="Machine maintenance",
                hazard="Unguarded rotating machinery",
                exposure="Worker exposed to moving equipment",
                barrier="Machine guarding / exclusion",
                barrier_failure="Guard missing",
                potential_consequence=consequence,
            )

        # CAUGHT-IN / CAUGHT-BETWEEN
        if any(p in text_lower for p in [
            "caught in", "caught-in", "caught between", "caught-between",
            "trapped between", "crushes hand", "crushed hand", "crush injury",
            "crushed between", "hand under motor", "hand under machinery",
            "between two pipes", "between pipes",
        ]):
            activity = (
                "Drilling operation"
                if any(p in text_lower for p in [
                    "tong", "drill tubing", "drilling", "drill pipe",
                    "drill rig", "oil rig"
                ])
                else "Machinery / equipment operation"
            )

            return ExtractionData(
                activity=activity,
                hazard="Caught-in / caught-between",
                exposure="Worker exposed to moving equipment",
                barrier="Machine guarding / exclusion",
                barrier_failure="Barrier bypass",
                potential_consequence=consequence,
            )

        # EXPLICIT SUSPENDED LOAD / FALLING LOAD
        if any(p in text_lower for p in [
            "drill bit", "500-pound drill bit", "falling load",
            "falling pipe", "falling equipment", "struck by a falling pipe",
            "struck by falling pipe",
        ]):
            return ExtractionData(
                activity="Material handling / lifting",
                hazard="Suspended load",
                exposure="Worker in line of fire",
                barrier="Rigging and exclusion zone",
                barrier_failure="Rigging failure",
                potential_consequence=consequence,
            )

        # STRUCK-BY / IMPACT
        if any(p in text_lower for p in [
            "strikes rebar", "head strikes rebar", "struck by rebar",
            "struck by rod basket", "strikes rod basket", "rod basket",
            "vee slide",
        ]):
            return ExtractionData(
                activity="Material handling / lifting",
                hazard="Struck-by / impact",
                exposure="Worker exposed to moving object",
                barrier="Exclusion zone",
                barrier_failure="Line-of-fire control failure",
                potential_consequence=consequence,
            )

        # BOP / WELL CONTROL
        if any(p in text_lower for p in [
            "bop", "blowout preventer", "annular bop", "ram bop",
            "well control", "mud density", "mud weight",
            "well blowout", "well blow",
        ]):
            return ExtractionData(
                activity="Well control / drilling operation",
                hazard="High-energy well control",
                exposure="Worker exposed to high-energy well operation",
                barrier="Well control / BOP system",
                barrier_failure="High-energy control failure",
                potential_consequence=consequence,
            )

        # PERFORATING
        if any(p in text_lower for p in [
            "perforating gun", "perforation gun", "perforating",
        ]):
            return ExtractionData(
                activity="Well completion / perforating",
                hazard="Pressure / explosive energy",
                exposure="Worker exposed to high-energy well operation",
                barrier="Well completion safety controls",
                barrier_failure="High-energy control failure",
                potential_consequence=consequence,
            )

        # HIGH PRESSURE HOSE / PRESSURE
        if any(p in text_lower for p in [
            "high pressure mud hose", "high-pressure mud hose",
            "mud hose sheared", "hose sheared", "pressure hose",
            "pressure release", "high pressure release",
            "high-pressure release", "pressure manifold",
            "pressurized line", "pressurized equipment",
        ]):
            return ExtractionData(
                activity="High-pressure equipment operation",
                hazard="Pressure release",
                exposure="Worker exposed to high-energy pressure",
                barrier="Pressure containment",
                barrier_failure="Loss of containment",
                potential_consequence=consequence,
            )

        # DBB / PROCESS ISOLATION
        if any(p in text_lower for p in [
            "double block and bleed", "double block bleed", "dbb isolation",
            "dbb", "isolation not verified", "isolation not confirmed",
            "opened without verifying isolation",
        ]):
            return ExtractionData(
                activity="Process isolation",
                hazard="Pressure release",
                exposure="Worker exposed to high-energy pressure",
                barrier="Process isolation / DBB",
                barrier_failure="Process isolation failure",
                potential_consequence=consequence,
            )

        # STATIC IGNITION / EARTHING
        if any(p in text_lower for p in [
            "static spark", "static ignition", "static electricity",
            "earthing jumper", "earthing bypass", "grounding jumper",
            "grounding bypass", "bypassed earthing", "bypassed grounding",
            "ignited hydrocarbon vapors",
        ]):
            return ExtractionData(
                activity="Hydrocarbon transfer / loading",
                hazard="Fire / explosion",
                exposure="Worker exposed to flammable atmosphere",
                barrier="Grounding / bonding",
                barrier_failure="Grounding / bonding control failure",
                potential_consequence=consequence,
            )

        # GAS / HYDROCARBON / FIRE
        if any(p in text_lower for p in [
            "gas leak", "gas leakage", "natural gas", "hydrocarbon leak",
            "hydrocarbon release", "hydrocarbon vapors", "lpg", "naphtha",
            "kerosene", "flash fire", "explosion", "exploded", "ignition",
            "flammable vapour", "flammable vapor",
        ]):
            return ExtractionData(
                activity="Oil and gas operations",
                hazard="Gas leak / pressure release",
                exposure="Worker exposed to hazardous atmosphere",
                barrier="Pressure containment",
                barrier_failure="Loss of containment",
                potential_consequence=consequence,
            )

        # ELECTRICAL
        if any(p in text_lower for p in [
            "power line", "power lines", "electrocuted", "electrocution",
            "electrical", "energized", "energised", "electric shock",
            "live wire", "high voltage",
        ]):
            activity = (
                "Drilling / equipment operation"
                if any(p in text_lower for p in [
                    "drill boom", "drilling", "drill rig", "oil rig"
                ])
                else "Electrical / equipment operation"
            )

            return ExtractionData(
                activity=activity,
                hazard="Electrical energy",
                exposure="Worker exposed to energized equipment",
                barrier="Electrical isolation",
                barrier_failure="LOTO violation",
                potential_consequence=consequence,
            )

        # DROWNING / WATER
        if any(p in text_lower for p in [
            "drowns", "drowned", "drowning", "falls into water",
            "fell into water", "submerged",
        ]):
            return ExtractionData(
                activity="Marine operation",
                hazard="Drowning",
                exposure="Worker exposed to water environment",
                barrier="Water rescue / flotation controls",
                barrier_failure="Water safety control failure",
                potential_consequence=consequence,
            )

        # LIFEBOAT
        if any(p in text_lower for p in ["lifeboat", "life boat"]):
            return ExtractionData(
                activity="Marine operation",
                hazard="Marine / lifeboat incident",
                exposure="Worker exposed to marine environment",
                barrier="Marine emergency controls",
                barrier_failure="Marine safety control failure",
                potential_consequence=consequence,
            )

        # SUSPENDED LOAD / RIGGING
        if any(p in text_lower for p in [
            "suspended load", "crane boom", "crane", "lifting", "lifted",
            "rigging", "wire rope", "drilling line", "falling pipe",
            "falling equipment", "falling load", "tongs", "roller guide",
            "travelling block", "traveling block", "pipe section",
            "counterweight",
        ]):
            return ExtractionData(
                activity="Material handling / lifting",
                hazard="Suspended load",
                exposure="Worker in line of fire",
                barrier="Rigging and exclusion zone",
                barrier_failure="Rigging failure",
                potential_consequence=consequence,
            )

        # DRILLING RIG SETUP
        if any(p in text_lower for p in [
            "setting up drilling rig", "setup drilling rig", "rig setup",
            "rig erection", "erecting drilling rig",
        ]):
            return ExtractionData(
                activity="Drilling rig setup",
                hazard="Drilling equipment incident",
                exposure="Worker exposed to drilling equipment",
                barrier="Safe operating controls",
                barrier_failure="Equipment safety control failure",
                potential_consequence=consequence,
            )

        # GENERIC DRILLING
        if any(p in text_lower for p in [
            "drilling rig", "drill rig", "drilling operation", "drilling",
            "oil rig", "oil well", "work-over rig", "workover rig",
            "hydraulic fracturing", "fracking", "tripping operations",
        ]):
            return ExtractionData(
                activity="Drilling operation",
                hazard="Drilling equipment incident",
                exposure="Worker exposed to drilling equipment",
                barrier="Safe operating controls",
                barrier_failure="Equipment safety control failure",
                potential_consequence=consequence,
            )

        # GENERIC STRUCK-BY
        if any(p in text_lower for p in [
            "struck", "strikes", "hit by", "hits", "impact", "collision",
        ]):
            return ExtractionData(
                activity="General equipment operation",
                hazard="Struck-by / impact",
                exposure="Worker exposed to moving object",
                barrier="Exclusion zone",
                barrier_failure="Line-of-fire control failure",
                potential_consequence=consequence,
            )

        return ExtractionData(
            activity="Unknown",
            hazard="Unknown",
            exposure="Unknown",
            barrier="Unknown",
            barrier_failure="Unknown",
            potential_consequence=consequence,
        )


nlp_service = MockNLPService()



