import { SqlClient } from '@effect/sql';
import { Effect, Option, pipe } from 'effect';
import {
  Todo,
  type TodoId,
  TodoNotFound,
} from '../../../../packages/domain/src/TodosApi.js';
import { SqlLive } from '../sql.js';
import { TodosRepository } from './repository.js';

export class Todos extends Effect.Service<Todos>()('Todos', {
  effect: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const todosRepo = yield* TodosRepository;

    const create = (text: string) =>
      todosRepo.insert(Todo.insert.make({ text, done: false }));

    const complete = (id: TodoId) =>
      pipe(
        todosRepo.findById(id),
        Effect.flatMap(
          Option.match({
            onNone: () => new TodoNotFound({ id }),
            onSome: (todo) =>
              todosRepo.update(
                Todo.update.make({
                  id,
                  text: todo.text,
                  done: true,
                })
              ),
          })
        ),
        sql.withTransaction,
        Effect.orDie,
        Effect.withSpan('Todos.complete', {
          attributes: { id },
        })
      );

    const remove = (id: TodoId) => todosRepo.delete(id).pipe(Effect.orDie);

    const findById = (id: TodoId) =>
      pipe(
        todosRepo.findById(id),
        Effect.flatMap(
          Option.match({
            onNone: () => new TodoNotFound({ id }),
            onSome: Effect.succeed,
          })
        ),
        Effect.withSpan('Todos.findById', {
          attributes: { id },
        })
      );

    return {
      getAll: todosRepo.getAll,
      create,
      complete,
      remove,
      findById,
    } as const;
  }),
  dependencies: [SqlLive, TodosRepository.Default],
}) {}
