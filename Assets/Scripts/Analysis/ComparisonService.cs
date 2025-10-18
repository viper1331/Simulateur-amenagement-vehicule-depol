namespace DepollutionVehicle.Analysis
{
    public struct ComparisonResult
    {
        public float DeltaMassKg;
        public float DeltaCogXmm;
        public float DeltaCogYmm;
        public float DeltaCogZmm;
        public float DeltaFrontMarginKg;
        public float DeltaRearMarginKg;
    }

    public static class ComparisonService
    {
        public static ComparisonResult Compare(MassBalanceResult a, AxleLoadResult axleA, MassBalanceResult b, AxleLoadResult axleB)
        {
            return new ComparisonResult
            {
                DeltaMassKg = b.TotalMass - a.TotalMass,
                DeltaCogXmm = (b.CenterOfGravity.x - a.CenterOfGravity.x) * 1000f,
                DeltaCogYmm = (b.CenterOfGravity.y - a.CenterOfGravity.y) * 1000f,
                DeltaCogZmm = (b.CenterOfGravity.z - a.CenterOfGravity.z) * 1000f,
                DeltaFrontMarginKg = axleB.FrontMarginKg - axleA.FrontMarginKg,
                DeltaRearMarginKg = axleB.RearMarginKg - axleA.RearMarginKg
            };
        }
    }
}
