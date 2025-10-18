using UnityEngine;

namespace DepollutionVehicle.Tools
{
    public static class SnappingUtility
    {
        public static Vector3 Snap(Vector3 position, float incrementMm)
        {
            float increment = Mathf.Max(1f, incrementMm) / 1000f;
            return new Vector3(
                Mathf.Round(position.x / increment) * increment,
                Mathf.Round(position.y / increment) * increment,
                Mathf.Round(position.z / increment) * increment);
        }
    }
}
