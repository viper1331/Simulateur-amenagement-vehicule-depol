using System.IO;
using System.Text;
using UnityEngine;

namespace DepollutionVehicle.Tools
{
    /// <summary>
    /// Minimal DXF writer generating polylines for plan view export.
    /// The implementation is simplified for documentation purposes.
    /// </summary>
    public static class DxfExporter
    {
        public static void ExportPlan(string path, Bounds floorBounds, Bounds[] moduleFootprints)
        {
            var builder = new StringBuilder();
            builder.AppendLine("0");
            builder.AppendLine("SECTION");
            builder.AppendLine("2");
            builder.AppendLine("ENTITIES");

            AppendBoundsPolyline(builder, floorBounds, "FLOOR");

            for (int i = 0; i < moduleFootprints.Length; i++)
            {
                AppendBoundsPolyline(builder, moduleFootprints[i], $"MODULE_{i}");
            }

            builder.AppendLine("0");
            builder.AppendLine("ENDSEC");
            builder.AppendLine("0");
            builder.AppendLine("EOF");

            File.WriteAllText(path, builder.ToString());
        }

        private static void AppendBoundsPolyline(StringBuilder builder, Bounds bounds, string layer)
        {
            var min = bounds.min;
            var max = bounds.max;

            builder.AppendLine("0");
            builder.AppendLine("LWPOLYLINE");
            builder.AppendLine("8");
            builder.AppendLine(layer);
            builder.AppendLine("90");
            builder.AppendLine("4");

            builder.AppendLine("10"); builder.AppendLine(min.x.ToString("F3")); builder.AppendLine("20"); builder.AppendLine(min.z.ToString("F3"));
            builder.AppendLine("10"); builder.AppendLine(max.x.ToString("F3")); builder.AppendLine("20"); builder.AppendLine(min.z.ToString("F3"));
            builder.AppendLine("10"); builder.AppendLine(max.x.ToString("F3")); builder.AppendLine("20"); builder.AppendLine(max.z.ToString("F3"));
            builder.AppendLine("10"); builder.AppendLine(min.x.ToString("F3")); builder.AppendLine("20"); builder.AppendLine(max.z.ToString("F3"));
        }
    }
}
