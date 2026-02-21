import { Router } from 'express';
import { listRecipients, addRecipient, removeRecipient } from '../services/database.service';

const router = Router();

// GET /api/recipients - lista todos os recipients ativos
router.get('/', async (req, res) => {
  try {
    const recipients = await listRecipients(false);
    res.json(recipients);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao listar recipients' });
  }
});

// POST /api/recipients - adiciona recipient { phone, name }
router.post('/', async (req, res) => {
  const { phone, name } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone é obrigatório' });
  try {
    const ok = await addRecipient(phone, name);
    if (ok) return res.status(201).json({ success: true });
    return res.status(500).json({ error: 'Erro ao adicionar recipient' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao adicionar recipient' });
  }
});

// DELETE /api/recipients/:phone - remove recipient pelo número
router.delete('/:phone', async (req, res) => {
  const { phone } = req.params;
  try {
    const ok = await removeRecipient(phone);
    if (ok) return res.json({ success: true });
    return res.status(404).json({ error: 'Recipient não encontrado' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erro ao remover recipient' });
  }
});

export default router;
