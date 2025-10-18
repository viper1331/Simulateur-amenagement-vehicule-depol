using System.IO;
using UnityEngine;

namespace DepollutionVehicle.Tools
{
    public static class JsonExporter
    {
        public static void Export(object data, string path)
        {
            var json = JsonUtility.ToJson(data, true);
            File.WriteAllText(path, json);
        }
    }
}
