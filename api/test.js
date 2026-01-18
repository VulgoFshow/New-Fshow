export const config = {
  runtime: "nodejs"
};

module.exports = (req, res) => {
  res.status(200).json({ ok: true });
};
