// Script para testar o webhook
const fs = require('fs');
const path = require('path');

async function testWebhook() {
  // Simular dados do agendamento
  const webhookData = new URLSearchParams();
  webhookData.append('From', 'whatsapp:+5585987654321'); // Seu número
  webhookData.append('Body', 'SIM');
  
  try {
    const response = await fetch('http://localhost:3000/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: webhookData.toString(),
    });

    console.log('Status:', response.status);
    console.log('Response:', await response.text());
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testWebhook();
