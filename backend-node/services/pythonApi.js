const axios = require("axios");

const PYTHON_API = process.env.PYTHON_API;

exports.enqueueUrl = async (url) => {
  const res = await axios.post(`${PYTHON_API}/enqueue`, { url });
  return res.data;
};

exports.getStatus = async (jobId) => {
  const res = await axios.get(`${PYTHON_API}/status/${jobId}`);
  return res.data;
};

exports.getResult = async (jobId) => {
  const res = await axios.get(`${PYTHON_API}/result/${jobId}`);
  return res.data;
};
