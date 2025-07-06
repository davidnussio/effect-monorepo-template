import { HttpApi, HttpApiEndpoint, HttpApiGroup } from '@effect/platform';
import { Model } from '@effect/sql';
import { Schema } from 'effect';

export const TodoId = Schema.Number.pipe(Schema.brand('TodoId'));
export type TodoId = typeof TodoId.Type;

export const TodoIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(TodoId)
);

const BooleanFromInteger = Schema.transform(
  // Source schema: 0 or 1
  Schema.Literal(0, 1),
  // Target schema: boolean
  Schema.Boolean,
  {
    // optional but you get better error messages from TypeScript
    strict: true,
    // Transformation to convert the output of the
    // source schema (0 | 1) into the input of the
    // target schema (boolean)
    decode: (literal) => literal === 1,
    // Reverse transformation
    encode: (bool) => (bool ? 1 : 0),
  }
);

export class Todo extends Model.Class<Todo>('Todo')({
  id: Model.Generated(TodoId),
  text: Schema.NonEmptyTrimmedString,
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
  done: BooleanFromInteger,
}) {}

export class TodoNotFound extends Schema.TaggedError<TodoNotFound>()(
  'TodoNotFound',
  {
    id: Schema.Number,
  }
) {}

export class TodosApiGroup extends HttpApiGroup.make('todos')
  .add(
    HttpApiEndpoint.get('getAllTodos', '/todos').addSuccess(Schema.Array(Todo))
  )
  .add(
    HttpApiEndpoint.get('getTodoById', '/todos/:id')
      .addSuccess(Todo)
      .addError(TodoNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: TodoIdFromString }))
  )
  .add(
    HttpApiEndpoint.post('createTodo', '/todos')
      .addSuccess(Todo)
      .setPayload(Schema.Struct({ text: Schema.NonEmptyTrimmedString }))
  )
  .add(
    HttpApiEndpoint.patch('completeTodo', '/todos/:id')
      .addSuccess(Todo)
      .addError(TodoNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: TodoIdFromString }))
  )
  .add(
    HttpApiEndpoint.del('removeTodo', '/todos/:id')
      .addSuccess(Schema.Void)
      .addError(TodoNotFound, { status: 404 })
      .setPath(Schema.Struct({ id: TodoIdFromString }))
  ) {}

export class TodosApi extends HttpApi.make('api').add(TodosApiGroup) {}
