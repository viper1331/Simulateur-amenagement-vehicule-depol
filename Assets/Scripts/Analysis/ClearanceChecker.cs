using System.Collections.Generic;
using UnityEngine;

namespace DepollutionVehicle.Analysis
{
    public class ClearanceChecker
    {
        private readonly List<ClearanceZone> zones = new List<ClearanceZone>();

        public void RegisterZone(ClearanceZone zone)
        {
            zones.Add(zone);
        }

        public IReadOnlyList<ClearanceViolation> Evaluate(IEnumerable<Bounds> occupiedVolumes)
        {
            var violations = new List<ClearanceViolation>();

            foreach (var zone in zones)
            {
                foreach (var bounds in occupiedVolumes)
                {
                    if (zone.Bounds.Intersects(bounds))
                    {
                        violations.Add(new ClearanceViolation(zone, bounds));
                    }
                }
            }

            return violations;
        }
    }

    public struct ClearanceZone
    {
        public string Id { get; }
        public Bounds Bounds { get; }
        public string Description { get; }

        public ClearanceZone(string id, Bounds bounds, string description)
        {
            Id = id;
            Bounds = bounds;
            Description = description;
        }
    }

    public struct ClearanceViolation
    {
        public ClearanceZone Zone { get; }
        public Bounds IntersectingBounds { get; }

        public ClearanceViolation(ClearanceZone zone, Bounds intersectingBounds)
        {
            Zone = zone;
            IntersectingBounds = intersectingBounds;
        }
    }
}
