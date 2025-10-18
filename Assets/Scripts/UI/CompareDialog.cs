using UnityEngine;
using UnityEngine.UI;
using DepollutionVehicle.Analysis;

namespace DepollutionVehicle.UI
{
    public class CompareDialog : MonoBehaviour
    {
        [SerializeField] private Text summaryLabel;

        public void Show(ComparisonResult result)
        {
            if (summaryLabel != null)
            {
                summaryLabel.text =
                    $"Δ Masse: {result.DeltaMassKg:F1} kg\n" +
                    $"Δ CoG (mm): X={result.DeltaCogXmm:F0}, Y={result.DeltaCogYmm:F0}, Z={result.DeltaCogZmm:F0}\n" +
                    $"Δ Marges essieux: AV={result.DeltaFrontMarginKg:F0} kg, AR={result.DeltaRearMarginKg:F0} kg";
            }

            gameObject.SetActive(true);
        }
    }
}
