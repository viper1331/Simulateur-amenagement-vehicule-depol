using UnityEngine;

namespace DepollutionVehicle.Tools
{
    public class RulerTool : MonoBehaviour
    {
        [SerializeField] private Vector3 startPoint;
        [SerializeField] private Vector3 endPoint;

        public void SetPoints(Vector3 start, Vector3 end)
        {
            startPoint = start;
            endPoint = end;
        }

        public float DistanceMillimeters => Vector3.Distance(startPoint, endPoint) * 1000f;
    }
}
