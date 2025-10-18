using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace DepollutionVehicle.UI
{
    public class Toast : MonoBehaviour
    {
        [SerializeField] private Text messageLabel;
        [SerializeField] private float durationSeconds = 2f;

        public void Show(string message)
        {
            if (messageLabel != null)
            {
                messageLabel.text = message;
            }

            gameObject.SetActive(true);
            StopAllCoroutines();
            StartCoroutine(HideRoutine());
        }

        private IEnumerator HideRoutine()
        {
            yield return new WaitForSeconds(durationSeconds);
            gameObject.SetActive(false);
        }
    }
}
