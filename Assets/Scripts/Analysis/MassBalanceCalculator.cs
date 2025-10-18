using System.Collections.Generic;
using UnityEngine;
using DepollutionVehicle.Domain;

namespace DepollutionVehicle.Analysis
{
    public class MassBalanceCalculator
    {
        public MassBalanceResult Compute(Chassis chassis, IReadOnlyList<PlacedModule> modules)
        {
            float totalMass = chassis?.PtacKilograms ?? 0f; // placeholder base mass assumption
            Vector3 weightedPosition = Vector3.zero;
            float totalModuleMass = 0f;

            foreach (var placed in modules)
            {
                var moduleMass = placed.Module.ComputeOperationalMass(placed.FillPercent);
                totalModuleMass += moduleMass;
                weightedPosition += placed.WorldPosition * moduleMass;
            }

            float combinedMass = totalMass + totalModuleMass;
            Vector3 centerOfGravity = combinedMass > 0.01f ? weightedPosition / totalModuleMass : Vector3.zero;

            return new MassBalanceResult
            {
                TotalMass = combinedMass,
                ModuleMass = totalModuleMass,
                CenterOfGravity = centerOfGravity
            };
        }
    }

    public struct MassBalanceResult
    {
        public float TotalMass;
        public float ModuleMass;
        public Vector3 CenterOfGravity;
    }

    public struct PlacedModule
    {
        public Module Module;
        public Vector3 WorldPosition;
        public float FillPercent;
    }
}
