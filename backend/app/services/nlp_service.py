from typing import Protocol

from app.schemas.analysis import ExtractionData


class NLPService(Protocol):
    def extract(self, text: str) -> ExtractionData:
        ...


class MockNLPService:
    """
    Dataset-informed, deterministic NLP extractor for SIF precursor analysis.

    The extractor uses explainable safety-pattern rules rather than an LLM.
    """

    def extract(self, text: str) -> ExtractionData:
        text_lower = text.lower()

        if not text.strip():
            return self._unknown()

        if "event description not provided" in text_lower:
            return self._unknown()

        # 1. Confined space
        if any(
            keyword in text_lower
            for keyword in (
                "confined space",
                "confined-space",
            )
        ):
            return ExtractionData(
                activity="Confined space entry",
                hazard="Confined space",
                exposure="Worker exposed inside confined space",
                barrier="Atmospheric testing",
                barrier_failure="Atmospheric testing not completed",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Fatality"
                ),
            )

        # 2. Unguarded rotating machinery
        # Keep this before the broader caught-in rules.
        if any(
            keyword in text_lower
            for keyword in (
                "rotating machine",
                "rotating machinery",
                "unguarded",
                "machine guarding",
            )
        ):
            return ExtractionData(
                activity="Machine maintenance",
                hazard="Unguarded rotating machinery",
                exposure="Worker near rotating equipment",
                barrier="Machine guarding",
                barrier_failure="Guard missing",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        # 3. Electrical energy
        if any(
            keyword in text_lower
            for keyword in (
                "electrocuted",
                "electrocution",
                "electric shock",
                "electrical shock",
                "power line",
                "power lines",
                "energized equipment",
                "electrical",
            )
        ):
            return ExtractionData(
                activity="Drilling / equipment operation",
                hazard="Electrical energy",
                exposure="Worker exposed to energized equipment",
                barrier="Electrical isolation",
                barrier_failure="LOTO violation",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        # 4. Gas leak / pressure release / fire / explosion
        if any(
            keyword in text_lower
            for keyword in (
                "gas leak",
                "gas line",
                "natural gas",
                "gas well",
                "gasoline vapor",
                "gasoline vapors",
                "gas ignition",
                "blowout",
                "blow up",
                "explosion",
                "explode",
                "flash fire",
                "fire",
                "burning oil",
                "burned",
                "burnt",
                "pressurized discharge",
                "pressurized",
                "pressure release",
                "rupture",
            )
        ):
            return ExtractionData(
                activity="Oil and gas operations",
                hazard="Gas leak / pressure release",
                exposure="Worker exposed to hazardous atmosphere",
                barrier="Pressure containment",
                barrier_failure="Loss of containment",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        # 5. Vehicle / mobile equipment
        # Use phrase-level matching to avoid matching "truck" inside "struck".
        if any(
            keyword in text_lower
            for keyword in (
                "run over",
                "run-over",
                "rolls over",
                "rollover",
                "vehicle",
                "tractor trailer",
                "bucket truck",
                "forklift",
            )
        ):
            return ExtractionData(
                activity="Vehicle / mobile equipment operation",
                hazard="Vehicle / mobile equipment",
                exposure="Worker exposed to moving vehicle or equipment",
                barrier="Vehicle exclusion / safe operating zone",
                barrier_failure="Mobile equipment control failure",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        # 6. Caught-in / caught-between
        if any(
            keyword in text_lower
            for keyword in (
                "caught between",
                "caught in",
                "caught by",
                "pinned between",
                "pinned by",
                "pulled into",
                "drawworks",
                "rotating pipe",
                "machine shaft",
                "auger",
                "drill bit jams",
                "drill bit jammed",
                "amputat",
            )
        ):
            return ExtractionData(
                activity="Drilling operation",
                hazard="Caught-in / caught-between",
                exposure="Worker exposed to moving equipment",
                barrier="Machine guarding / exclusion",
                barrier_failure="Barrier bypass",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        # Specific mechanism overrides before the broad struck-by / crushing rule.
        # This prevents generic keywords such as "derrick" or "crushed" from
        # overriding a clearly stated fall or equipment-collapse mechanism.

        if any(
            keyword in text_lower
            for keyword in (
                "fall from",
                "falling from",
                "fell from",
                "fall from height",
                "after fall",
                "fall and",
                "fall through",
                "falling through",
                "knocked off",
                "fracture leg in fall",
                "fractured leg in fall",
                "derrick board",
                "opening in floor",
                "gap in floor",
                "rig floor",
            )
        ):
            return ExtractionData(
                activity="Work at height",
                hazard="Fall from height",
                exposure="Worker exposed to fall hazard",
                barrier="Fall protection",
                barrier_failure="Fall protection failure",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        if any(
            keyword in text_lower
            for keyword in (
                "overturns",
                "overturned",
                "tips over",
                "toppled",
                "collapsing rig",
                "equipment collapses",
                "equipment collapse",
                "rig collapse",
                "collapsing rig mast",
                "collapsing oil derrick",
                "toppled oil derrick",
            )
        ):
            return ExtractionData(
                activity="Drilling rig / equipment operation",
                hazard="Equipment instability / collapse",
                exposure="Worker exposed to unstable equipment",
                barrier="Equipment stability controls",
                barrier_failure="Equipment stability failure",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        # 7. Suspended load / struck-by / crushing
        if any(
            keyword in text_lower
            for keyword in (
                "500-pound drill bit",
                "500 pound drill bit",
                "falling pipe",
                "falling object",
                "falling load",
                "falling blocks",
                "falling drill rig",
                "falling handrail",
                "falling shaft",
                "falling unsecured",
                "crushed by",
                "crushed between",
                "crush injuries",
                "crushed",
                "counterweight",
                "ring block",
                "traveling blocks",
                "travelling blocks",
                "crane boom",
                "drill boom",
                "derrick",
                "drilling pipe",
                "suspended load",
                "rigging",
                "struck by",
                "struck on head",
                "struck in head",
                "struck in chest",
                "flying debris",
                "flying object",
                "drill stern",
                "caisson",
            )
        ):
            return ExtractionData(
                activity="Material handling / lifting",
                hazard="Suspended load",
                exposure="Worker in line of fire",
                barrier="Rigging and exclusion zone",
                barrier_failure="Rigging failure",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        # 8. Fall from height / opening
        if any(
            keyword in text_lower
            for keyword in (
                "fall from",
                "falling from",
                "fell from",
                "fall from height",
                "fall through",
                "falling through",
                "knocked off",
                "fracture leg in fall",
                "fractured leg in fall",
                "rig platform",
                "platform",
                "rig floor",
                "derrick board",
                "opening in floor",
                "gap in floor",
                "climbing stairs",
            )
        ):
            return ExtractionData(
                activity="Work at height",
                hazard="Fall from height",
                exposure="Worker exposed to fall hazard",
                barrier="Fall protection",
                barrier_failure="Fall protection failure",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        # 9. Drowning / water exposure
        if any(
            keyword in text_lower
            for keyword in (
                "drowns",
                "drowned",
                "drowning",
                "underwater",
                "mussel diver",
            )
        ):
            return ExtractionData(
                activity="Marine / water operation",
                hazard="Drowning",
                exposure="Worker exposed to water environment",
                barrier="Water rescue / flotation controls",
                barrier_failure="Water safety control failure",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Fatality"
                ),
            )

        # 10. Equipment instability / collapse
        if any(
            keyword in text_lower
            for keyword in (
                "overturns",
                "overturned",
                "tips over",
                "toppled",
                "collapsing rig",
                "equipment collapses",
                "equipment collapse",
                "rig collapse",
            )
        ):
            return ExtractionData(
                activity="Drilling rig / equipment operation",
                hazard="Equipment instability / collapse",
                exposure="Worker exposed to unstable equipment",
                barrier="Equipment stability controls",
                barrier_failure="Equipment stability failure",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        # 11. Specialized drilling / marine incidents

        # Generic drilling-equipment injuries where the exact mechanism
        # cannot be safely inferred from the report.
        if any(
            keyword in text_lower
            for keyword in (
                "injures finger on drilling rig",
                "injured by drilling rig",
                "injured by drilling apparatus",
                "lacerates hand on drilling apparatus",
                "lacerates hand on cable",
                "injured while operating rock drill",
                "drilling rig accident",
                "drilling rig incident",
            )
        ):
            return ExtractionData(
                activity="Drilling operation",
                hazard="Drilling equipment incident",
                exposure="Worker exposed to drilling equipment",
                barrier="Safe operating controls",
                barrier_failure="Equipment safety control failure",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Medical treatment"
                ),
            )

        # Drilling-rig setup.
        if any(
            keyword in text_lower
            for keyword in (
                "setting up drilling rig",
                "setup drilling rig",
                "setting up the drilling rig",
            )
        ):
            return ExtractionData(
                activity="Drilling rig setup",
                hazard="Drilling equipment incident",
                exposure="Worker exposed to drilling equipment",
                barrier="Safe setup procedures",
                barrier_failure="Equipment safety control failure",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        # Marine / lifeboat incidents.
        if any(
            keyword in text_lower
            for keyword in (
                "lifeboat accident",
                "lifeboat",
            )
        ):
            return ExtractionData(
                activity="Marine operation",
                hazard="Marine / lifeboat incident",
                exposure="Worker exposed to marine environment",
                barrier="Marine emergency controls",
                barrier_failure="Marine safety control failure",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        # Perforating-gun incidents involve high-energy well-completion
        # operations. Do not infer a more specific mechanism than the text supports.
        if "perforating gun" in text_lower:
            return ExtractionData(
                activity="Well completion / perforating",
                hazard="Pressure / explosive energy",
                exposure="Worker exposed to high-energy well operation",
                barrier="Well completion safety controls",
                barrier_failure="High-energy control failure",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        # Generic drilling-rig incident where the report names the rig
        # but does not provide a more specific mechanism.
        if (
            "at drilling rig" in text_lower
            or "at the drilling rig" in text_lower
            or "drilling rig" in text_lower
        ) and any(
            keyword in text_lower
            for keyword in (
                "injured",
                "injures",
                "injury",
                "killed",
                "dies",
                "died",
                "fatal",
            )
        ):
            return ExtractionData(
                activity="Drilling operation",
                hazard="Drilling equipment incident",
                exposure="Worker exposed to drilling equipment",
                barrier="Safe operating controls",
                barrier_failure="Equipment safety control failure",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        # 11. General struck-by / impact
        if any(
            keyword in text_lower
            for keyword in (
                "struck",
                "hit by",
                "hit with",
                "impact",
                "blunt trauma",
            )
        ):
            return ExtractionData(
                activity="Drilling / equipment operation",
                hazard="Struck-by / impact",
                exposure="Worker exposed to moving object",
                barrier="Exclusion zone",
                barrier_failure="Line-of-fire control failure",
                potential_consequence=self._extract_consequence(
                    text_lower, default="Serious injury"
                ),
            )

        return self._unknown()

    @staticmethod
    def _extract_consequence(text: str, default: str) -> str:
        if any(
            keyword in text
            for keyword in (
                "killed",
                "kills",
                "dies",
                "died",
                "death",
                "fatal",
                "fatally",
            )
        ):
            return "Fatality"

        if any(
            keyword in text
            for keyword in (
                "electrocuted",
                "electrocution",
                "drowns",
                "drowned",
                "drowning",
            )
        ):
            return "Fatality"

        if any(
            keyword in text
            for keyword in (
                "amputat",
                "fracture",
                "broken",
                "crushed",
                "paralyzed",
                "severe",
                "multiple blunt trauma",
            )
        ):
            return "Serious injury"

        if any(
            keyword in text
            for keyword in (
                "injur",
                "lacerat",
                "hurt",
                "burned",
                "burnt",
            )
        ):
            return "Medical treatment"

        return default

    @staticmethod
    def _unknown() -> ExtractionData:
        return ExtractionData(
            activity="Unknown",
            hazard="Unknown",
            exposure="Unknown",
            barrier="Unknown",
            barrier_failure="Unknown",
            potential_consequence="Unknown",
        )


nlp_service: NLPService = MockNLPService()
