using UnityEngine;
using DepollutionVehicle.Analysis;

namespace DepollutionVehicle.Core
{
    public class ApplicationBootstrap : MonoBehaviour
    {
        [SerializeField] private PlacementController placementController;
        [SerializeField] private Analysis.AnalysisPanel analysisPanel;

        private readonly MassBalanceCalculator massCalculator = new MassBalanceCalculator();
        private readonly AxleLoadEstimator axleEstimator = new AxleLoadEstimator();

        private void Start()
        {
            Debug.Log("Application bootstrap initialized");
        }

        public void RefreshAnalysis()
        {
            // Placeholder update to illustrate workflow.
        }
    }
}
