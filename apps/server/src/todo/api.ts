import { HttpApiBuilder } from '@effect/platform';
import { TodosApi } from '@template/domain/TodosApi';
import { Effect, Layer } from 'effect';
import { Todos } from './service.js';

const TodosApiLive = HttpApiBuilder.group(TodosApi, 'todos', (handlers) =>
  Effect.gen(function* () {
    const todos = yield* Todos;
    return handlers
      .handle('getAllTodos', () => todos.getAll())
      .handle('getTodoById', ({ path: { id } }) => todos.findById(id))
      .handle('createTodo', ({ payload: { text } }) => todos.create(text))
      .handle('completeTodo', ({ path: { id } }) => todos.complete(id))
      .handle('removeTodo', ({ path: { id } }) => todos.remove(id));
  })
);

export const ApiLive = HttpApiBuilder.api(TodosApi).pipe(
  Layer.provide(TodosApiLive)
);
