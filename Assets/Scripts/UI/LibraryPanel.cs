using UnityEngine;
using UnityEngine.UI;

namespace DepollutionVehicle.UI
{
    public class LibraryPanel : MonoBehaviour
    {
        [SerializeField] private ScrollRect scrollRect;
        [SerializeField] private InputField searchField;

        private void Awake()
        {
            if (searchField != null)
            {
                searchField.onValueChanged.AddListener(OnSearchChanged);
            }
        }

        private void OnDestroy()
        {
            if (searchField != null)
            {
                searchField.onValueChanged.RemoveListener(OnSearchChanged);
            }
        }

        private void OnSearchChanged(string value)
        {
            Debug.Log($"Filter library: {value}");
        }
    }
}
