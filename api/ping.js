export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    ts: new Date().toISOString(),
    env_present: {
      CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_UNSIGNED_PRESET: !!process.env.CLOUDINARY_UNSIGNED_PRESET
    }
  });
}
