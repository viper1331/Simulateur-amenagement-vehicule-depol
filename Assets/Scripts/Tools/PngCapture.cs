using System.IO;
using UnityEngine;

namespace DepollutionVehicle.Tools
{
    public static class PngCapture
    {
        public static void Capture(Camera camera, string path, int resolution)
        {
            var renderTexture = new RenderTexture(resolution, resolution, 24);
            camera.targetTexture = renderTexture;
            var texture = new Texture2D(resolution, resolution, TextureFormat.RGBA32, false);

            camera.Render();
            RenderTexture.active = renderTexture;
            texture.ReadPixels(new Rect(0, 0, resolution, resolution), 0, 0);
            texture.Apply();

            camera.targetTexture = null;
            RenderTexture.active = null;
            Object.DestroyImmediate(renderTexture);

            var bytes = texture.EncodeToPNG();
            File.WriteAllBytes(path, bytes);
        }
    }
}
