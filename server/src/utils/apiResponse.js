const ok = (res, data, message = 'Success') =>
  res.status(200).json({ success: true, data, message })

const created = (res, data, message = 'Created') =>
  res.status(201).json({ success: true, data, message })

const fail = (res, statusCode, message) =>
  res.status(statusCode).json({ success: false, message })

module.exports = { ok, created, fail }
