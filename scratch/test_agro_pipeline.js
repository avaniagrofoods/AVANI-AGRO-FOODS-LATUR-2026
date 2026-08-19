
const testAgroLead = async () => {
  const payload = {
    name: "Test Agro Lead",
    phone: "919999999999",
    email: "test@agro.com",
    source: "Test_Script_Validation",
    message: "Validating Agro Multi-Channel Pipeline"
  };

  console.log("Testing Avani Agro Foods API...");
  try {
    const response = await fetch('https://www.avaniagrofoods.com/api/save-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Test Failed:", err.message);
  }
};

testAgroLead();
