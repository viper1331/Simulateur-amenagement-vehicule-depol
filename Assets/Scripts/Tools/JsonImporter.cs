using System.IO;
using UnityEngine;

namespace DepollutionVehicle.Tools
{
    public static class JsonImporter
    {
        public static T Import<T>(string path)
        {
            if (!File.Exists(path))
            {
                Debug.LogError($"JSON file not found: {path}");
                return default;
            }

            var json = File.ReadAllText(path);
            return JsonUtility.FromJson<T>(json);
        }
    }
}
