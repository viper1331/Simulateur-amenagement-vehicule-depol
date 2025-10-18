using UnityEngine;

namespace DepollutionVehicle.UI
{
    public class TopBarController : MonoBehaviour
    {
        public void OnNewProject() => Debug.Log("New project");
        public void OnOpenJson() => Debug.Log("Open JSON");
        public void OnSaveJson() => Debug.Log("Save JSON");
        public void OnExportPng() => Debug.Log("Export PNG");
        public void OnExportDxf() => Debug.Log("Export DXF");
        public void OnCompare() => Debug.Log("Compare configurations");
    }
}
