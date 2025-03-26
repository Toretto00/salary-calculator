deleteEmployee: async (id) => {
  const response = await axios.delete(`${API_URL}/employees/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.data;
}, 