using System;
using UnityEngine;

namespace DepollutionVehicle.Domain
{
    public enum ModuleCategory
    {
        Tank,
        Pump,
        HoseReel,
        Cabinet,
        GenSet,
        Storage,
        Custom
    }

    [Serializable]
    public abstract class Module
    {
        [SerializeField] protected string id;
        [SerializeField] protected string label;
        [SerializeField] protected Vector3 dimensionsMillimeters;
        [SerializeField] protected float massEmptyKilograms;
        [SerializeField] protected Vector3 anchorOriginMillimeters;
        [SerializeField] protected Vector3 allowedAxes;
        [SerializeField] protected SafetyClearance safetyClearances;
        [SerializeField] protected ModuleCategory category;

        public string Id => id;
        public string Label => label;
        public Vector3 DimensionsMillimeters => dimensionsMillimeters;
        public float MassEmptyKilograms => massEmptyKilograms;
        public Vector3 AnchorOriginMillimeters => anchorOriginMillimeters;
        public Vector3 AllowedAxes => allowedAxes;
        public SafetyClearance SafetyClearances => safetyClearances;
        public ModuleCategory Category => category;

        public virtual float ComputeOperationalMass(float fillPercent)
        {
            return massEmptyKilograms;
        }
    }

    [Serializable]
    public struct SafetyClearance
    {
        public float Front;
        public float Rear;
        public float Left;
        public float Right;
        public float Top;
    }

    [Serializable]
    public class TankModule : Module
    {
        [SerializeField] private float fluidDensityKgPerM3;
        [SerializeField] private float capacityLiters;

        public float FluidDensityKgPerM3 => fluidDensityKgPerM3;
        public float CapacityLiters => capacityLiters;

        public override float ComputeOperationalMass(float fillPercent)
        {
            var fillRatio = Mathf.Clamp01(fillPercent / 100f);
            var massFluid = capacityLiters / 1000f * fluidDensityKgPerM3 * fillRatio;
            return massEmptyKilograms + massFluid;
        }
    }

    [Serializable]
    public class PumpModule : Module
    {
        [SerializeField] private float powerKilowatts;
        public float PowerKilowatts => powerKilowatts;
    }

    [Serializable]
    public class HoseReelModule : Module
    {
        [SerializeField] private float hoseLengthMeters;
        public float HoseLengthMeters => hoseLengthMeters;
    }

    [Serializable]
    public class CabinetModule : Module
    {
        [SerializeField] private int shelves;
        [SerializeField] private bool lockable;

        public int Shelves => shelves;
        public bool Lockable => lockable;
    }

    [Serializable]
    public class GenSetModule : Module
    {
        [SerializeField] private float apparentPowerKva;
        [SerializeField] private float fuelCapacityLiters;

        public float ApparentPowerKva => apparentPowerKva;
        public float FuelCapacityLiters => fuelCapacityLiters;
    }
}
