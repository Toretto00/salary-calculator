exportPayslip: async (salaryId) => {
  const response = await axios.get(`${API_URL}/salary/${salaryId}/payslip`, {
    responseType: 'blob',
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response;
}, 