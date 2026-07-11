const stripe = require('stripe');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const { montant, articles, stripeKey, boutiqueNom, successUrl, cancelUrl } = req.body;
    
    if (!montant || !stripeKey) {
      return res.status(400).json({ error: 'Montant et clé Stripe requis' });
    }

    const stripeClient = stripe(stripeKey);
    
    // Créer les line items
    const lineItems = articles && articles.length > 0 ? articles.map(function(a) {
      return {
        price_data: {
          currency: 'eur',
          product_data: { name: a.nom },
          unit_amount: Math.round(a.prix * 100),
        },
        quantity: a.quantite || 1,
      };
    }) : [{
      price_data: {
        currency: 'eur',
        product_data: { name: 'Commande ' + (boutiqueNom || 'Mihi') },
        unit_amount: Math.round(parseFloat(montant) * 100),
      },
      quantity: 1,
    }];

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl || 'https://baa-vitrine.vercel.app/?success=true',
      cancel_url: cancelUrl || 'https://baa-vitrine.vercel.app/?cancel=true',
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
};
