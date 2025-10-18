using System;
using System.Collections.Generic;

namespace DepollutionVehicle.Core
{
    public class UndoRedoManager
    {
        private readonly Stack<Action> undoStack = new Stack<Action>();
        private readonly Stack<Action> redoStack = new Stack<Action>();

        public void Register(Action undo, Action redo)
        {
            undoStack.Push(undo);
            redoStack.Push(redo);
        }

        public void Undo()
        {
            if (undoStack.Count == 0)
            {
                return;
            }

            var undo = undoStack.Pop();
            undo?.Invoke();
        }

        public void Redo()
        {
            if (redoStack.Count == 0)
            {
                return;
            }

            var redo = redoStack.Pop();
            redo?.Invoke();
        }

        public void Clear()
        {
            undoStack.Clear();
            redoStack.Clear();
        }
    }
}
