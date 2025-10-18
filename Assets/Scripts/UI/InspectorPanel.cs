using UnityEngine;
using UnityEngine.UI;
using DepollutionVehicle.Domain;

namespace DepollutionVehicle.UI
{
    public class InspectorPanel : MonoBehaviour
    {
        [SerializeField] private Text moduleName;
        [SerializeField] private Slider fillSlider;

        private Module inspectedModule;

        public void Inspect(Module module)
        {
            inspectedModule = module;
            if (moduleName != null)
            {
                moduleName.text = module?.Label ?? "";
            }
        }

        private void Awake()
        {
            if (fillSlider != null)
            {
                fillSlider.onValueChanged.AddListener(OnFillChanged);
            }
        }

        private void OnDestroy()
        {
            if (fillSlider != null)
            {
                fillSlider.onValueChanged.RemoveListener(OnFillChanged);
            }
        }

        private void OnFillChanged(float value)
        {
            Debug.Log($"Module fill changed: {value}");
        }
    }
}
