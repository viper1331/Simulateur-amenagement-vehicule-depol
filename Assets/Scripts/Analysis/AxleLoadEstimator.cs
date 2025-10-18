using UnityEngine;
using DepollutionVehicle.Domain;

namespace DepollutionVehicle.Analysis
{
    public class AxleLoadEstimator
    {
        public AxleLoadResult EstimateLoads(Chassis chassis, MassBalanceResult massResult, Vector3 cogWorldPosition)
        {
            if (chassis == null || massResult.TotalMass <= 0f)
            {
                return AxleLoadResult.Empty;
            }

            float wheelbase = chassis.WheelbaseMillimeters / 1000f;
            float distanceFront = Mathf.Max(0.01f, cogWorldPosition.x);
            float distanceRear = Mathf.Max(0.01f, wheelbase - distanceFront);

            float frontLoad = massResult.TotalMass * (distanceRear / wheelbase);
            float rearLoad = massResult.TotalMass * (distanceFront / wheelbase);

            return new AxleLoadResult
            {
                FrontAxleLoadKg = frontLoad,
                RearAxleLoadKg = rearLoad,
                FrontMarginKg = chassis.MaxFrontAxleKilograms - frontLoad,
                RearMarginKg = chassis.MaxRearAxleKilograms - rearLoad
            };
        }
    }

    public struct AxleLoadResult
    {
        public float FrontAxleLoadKg;
        public float RearAxleLoadKg;
        public float FrontMarginKg;
        public float RearMarginKg;

        public bool IsFrontOverloaded => FrontMarginKg < 0f;
        public bool IsRearOverloaded => RearMarginKg < 0f;

        public static AxleLoadResult Empty => new AxleLoadResult();
    }
}
