using UnityEngine;
using UnityEngine.UI;
using DepollutionVehicle.Analysis;

namespace DepollutionVehicle.UI
{
    public class AnalysisPanel : MonoBehaviour
    {
        [SerializeField] private Text totalMassLabel;
        [SerializeField] private Text cogLabel;
        [SerializeField] private Text axleLabel;

        public void UpdateAnalysis(MassBalanceResult massResult, AxleLoadResult axleResult)
        {
            if (totalMassLabel != null)
            {
                totalMassLabel.text = $"Masse totale: {massResult.TotalMass:F1} kg";
            }

            if (cogLabel != null)
            {
                cogLabel.text = $"CoG: {massResult.CenterOfGravity.x * 1000f:F0}; {massResult.CenterOfGravity.y * 1000f:F0}; {massResult.CenterOfGravity.z * 1000f:F0} mm";
            }

            if (axleLabel != null)
            {
                axleLabel.text = $"Marges essieux AV/AR: {axleResult.FrontMarginKg:F0} / {axleResult.RearMarginKg:F0} kg";
            }
        }
    }
}
