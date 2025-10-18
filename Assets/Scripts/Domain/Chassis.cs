using System;
using UnityEngine;

namespace DepollutionVehicle.Domain
{
    /// <summary>
    /// Represents the base chassis definition loaded from a preset entry.
    /// </summary>
    [Serializable]
    public class Chassis
    {
        [SerializeField] private string id;
        [SerializeField] private string label;
        [SerializeField] private Vector3 dimensionsMillimeters;
        [SerializeField] private float wheelbaseMillimeters;
        [SerializeField] private float frontOverhangMillimeters;
        [SerializeField] private float rearOverhangMillimeters;
        [SerializeField] private float ptacKilograms;
        [SerializeField] private float maxFrontAxleKilograms;
        [SerializeField] private float maxRearAxleKilograms;

        public string Id => id;
        public string Label => label;
        public Vector3 DimensionsMillimeters => dimensionsMillimeters;
        public float WheelbaseMillimeters => wheelbaseMillimeters;
        public float FrontOverhangMillimeters => frontOverhangMillimeters;
        public float RearOverhangMillimeters => rearOverhangMillimeters;
        public float PtacKilograms => ptacKilograms;
        public float MaxFrontAxleKilograms => maxFrontAxleKilograms;
        public float MaxRearAxleKilograms => maxRearAxleKilograms;

        public float LengthMillimeters => dimensionsMillimeters.x;
        public float WidthMillimeters => dimensionsMillimeters.y;
        public float HeightMillimeters => dimensionsMillimeters.z;

        public static Chassis FromPreset(ChassisPreset preset)
        {
            return new Chassis
            {
                id = preset.id,
                label = preset.label,
                dimensionsMillimeters = preset.dimensions_mm.ToVector3(),
                wheelbaseMillimeters = preset.wheelbase_mm,
                frontOverhangMillimeters = preset.front_overhang_mm,
                rearOverhangMillimeters = preset.rear_overhang_mm,
                ptacKilograms = preset.ptac_kg,
                maxFrontAxleKilograms = preset.max_front_axle_kg,
                maxRearAxleKilograms = preset.max_rear_axle_kg
            };
        }
    }

    [Serializable]
    public class ChassisPreset
    {
        public string id;
        public string label;
        public DimensionPreset dimensions_mm;
        public float wheelbase_mm;
        public float front_overhang_mm;
        public float rear_overhang_mm;
        public float ptac_kg;
        public float max_front_axle_kg;
        public float max_rear_axle_kg;
    }

    [Serializable]
    public struct DimensionPreset
    {
        public float L;
        public float W;
        public float H;

        public Vector3 ToVector3()
        {
            return new Vector3(L, W, H);
        }
    }
}
