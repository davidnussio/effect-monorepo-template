/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import { Model, SqlClient, SqlSchema } from '@effect/sql';
import { Todo } from '@template/domain/TodosApi';
import { Effect, pipe, Schema } from 'effect';

export class TodosRepository extends Effect.Service<TodosRepository>()(
  'api/TodosRepository',
  {
    effect: Effect.gen(function* () {
      yield* Effect.log('TodosRepository initialized');
      const sql = yield* SqlClient.SqlClient;
      const crud = yield* Model.makeRepository(Todo, {
        tableName: 'todos',
        spanPrefix: 'TodosRepository',
        idColumn: 'id',
      }).pipe(Effect.orDie);

      const getAllSchema = SqlSchema.findAll({
        Request: Schema.Void,
        Result: Todo,
        execute: () => sql`SELECT * FROM todos`,
      });
      const getAll = () => {
        console.log('Fetching all todos');
        return pipe(
          getAllSchema(),
          // Effect.flatMap((todos) => {
          //   console.log(`Found ${todos.length} todos`, todos);
          //   if (todos.length === 0) {
          //     return Effect.fail(new Error('No todos found'));
          //   }
          //   return Effect.succeed(todos);
          // }),
          Effect.orDie,
          Effect.withSpan('UsersRepo.findAll')
        );
      };
      return {
        ...crud,
        getAll,
      } as const;
    }),
  }
) {}
