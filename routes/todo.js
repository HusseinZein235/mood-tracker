const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');
const { isAuth } = require('../middleware/auth');

// Get all todos for a user
router.get('/', isAuth, async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.session.user.id }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Create todo
router.post('/', isAuth, async (req, res) => {
  try {
    const { text } = req.body;
    
    const newTodo = new Todo({
      user: req.session.user.id,
      text
    });
    
    const todo = await newTodo.save();
    res.status(201).json(todo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Toggle todo completion
router.put('/:id', isAuth, async (req, res) => {
  try {
    const todoId = req.params.id;
    const userId = req.session.user.id;
    
    console.log(`Toggle todo ${todoId} for user ${userId}`);
    
    let todo = await Todo.findById(todoId);
    
    if (!todo) {
      return res.status(404).json({ msg: 'المهمة غير موجودة' });
    }
    
    const todoUserId = todo.user.toString();
    console.log(`Todo belongs to user ${todoUserId}`);
    
    // Check if todo belongs to user
    if (todoUserId !== userId) {
      console.log(`User ID mismatch: ${todoUserId} !== ${userId}`);
      return res.status(401).json({ msg: 'غير مصرح به' });
    }
    
    // Toggle completed status
    todo.completed = !todo.completed;
    await todo.save();
    
    res.json(todo);
  } catch (err) {
    console.error('Error toggling todo:', err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Delete todo
router.delete('/:id', isAuth, async (req, res) => {
  try {
    const todoId = req.params.id;
    const userId = req.session.user.id;
    
    console.log(`Delete todo ${todoId} for user ${userId}`);
    
    const todo = await Todo.findById(todoId);
    
    if (!todo) {
      return res.status(404).json({ msg: 'المهمة غير موجودة' });
    }
    
    const todoUserId = todo.user.toString();
    console.log(`Todo belongs to user ${todoUserId}`);
    
    // Check if todo belongs to user
    if (todoUserId !== userId) {
      console.log(`User ID mismatch: ${todoUserId} !== ${userId}`);
      return res.status(401).json({ msg: 'غير مصرح به' });
    }
    
    await todo.deleteOne();
    
    res.json({ msg: 'تم حذف المهمة' });
  } catch (err) {
    console.error('Error deleting todo:', err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

module.exports = router; 