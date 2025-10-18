using System.Collections.Generic;
using UnityEngine;
using DepollutionVehicle.Domain;

namespace DepollutionVehicle.Core
{
    /// <summary>
    /// Simplified placement controller placeholder.
    /// Would normally handle gizmos and user input.
    /// </summary>
    public class PlacementController : MonoBehaviour
    {
        [SerializeField] private float snapIncrementMillimeters = 50f;
        [SerializeField] private List<Module> placedModules = new List<Module>();

        public float SnapIncrementMillimeters
        {
            get => snapIncrementMillimeters;
            set => snapIncrementMillimeters = Mathf.Clamp(value, 10f, 1000f);
        }

        public IReadOnlyList<Module> PlacedModules => placedModules;

        public Vector3 SnapPosition(Vector3 worldPosition)
        {
            var increment = snapIncrementMillimeters / 1000f;
            return new Vector3(
                Mathf.Round(worldPosition.x / increment) * increment,
                Mathf.Round(worldPosition.y / increment) * increment,
                Mathf.Round(worldPosition.z / increment) * increment);
        }

        public void RegisterModule(Module module)
        {
            if (module != null && !placedModules.Contains(module))
            {
                placedModules.Add(module);
            }
        }

        public void UnregisterModule(Module module)
        {
            if (module != null)
            {
                placedModules.Remove(module);
            }
        }
    }
}
