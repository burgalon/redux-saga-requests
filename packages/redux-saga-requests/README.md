# redux-saga-requests

[![npm version](https://badge.fury.io/js/redux-saga-requests.svg)](https://badge.fury.io/js/redux-saga-requests)
[![gzip size](http://img.badgesize.io/https://unpkg.com/redux-saga-requests/dist/redux-saga-requests.min.js?compression=gzip)](https://unpkg.com/redux-saga-requests)
[![dependencies](https://david-dm.org/klis87/redux-saga-requests.svg?path=packages/redux-saga-requests)](https://david-dm.org/klis87/redux-saga-requests?path=packages/redux-saga-requests)
[![dev dependencies](https://david-dm.org/klis87/redux-saga-requests/dev-status.svg?path=packages/redux-saga-requests)](https://david-dm.org/klis87/redux-saga-requests?path=packages/redux-saga-requests&type=dev)
[![peer dependencies](https://david-dm.org/klis87/redux-saga-requests/peer-status.svg?path=packages/redux-saga-requests)](https://david-dm.org/klis87/redux-saga-requests?path=packages/redux-saga-requests&type=peer)
[![Build Status](https://travis-ci.org/klis87/redux-saga-requests.svg?branch=master)](https://travis-ci.org/klis87/redux-saga-requests)
[![Coverage Status](https://coveralls.io/repos/github/klis87/redux-saga-requests/badge.svg?branch=master)](https://coveralls.io/github/klis87/redux-saga-requests?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/klis87/redux-saga-requests/badge.svg)](https://snyk.io/test/github/klis87/redux-saga-requests)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Redux-Saga addon to simplify handling of AJAX requests. It supports Axios and Fetch API, but different
integrations could be added, as they are implemented in a plugin fashion.

## Table of content

- [Motivation](#motivation-arrow_up)
- [Installation](#installation-arrow_up)
- [Usage](#usage-arrow_up)
- [Actions](#actions-arrow_up)
- [Reducers](#reducers-arrow_up)
- [Interceptors](#interceptors-arrow_up)
- [FSA](#fsa-arrow_up)
- [Promise middleware](#promise-middleware-arrow_up)
- [Usage with Fetch API](#usage-with-fetch-api-arrow_up)
- [Mocking](#mocking-arrow_up)
- [Multiple drivers](#multiple-drivers-arrow_up)
- [Examples](#examples-arrow_up)

## Motivation [:arrow_up:](#table-of-content)

With `redux-saga-requests`, assuming you use `axios` you could refactor a code in the following way:
```diff
  import axios from 'axios';
- import { takeEvery, put, call } from 'redux-saga/effects';
+ import { createRequestInstance, watchRequests, requestsReducer } from 'redux-saga-requests';
+ import { createDriver } from 'redux-saga-requests-axios';

  const FETCH_BOOKS = 'FETCH_BOOKS';
- const FETCH_BOOKS_SUCCESS = 'FETCH_BOOKS_SUCCESS';
- const FETCH_BOOKS_ERROR = 'FETCH_BOOKS_ERROR';

- const fetchBooks = () => ({ type: FETCH_BOOKS });
- const fetchBooksSuccess = data => ({ type: FETCH_BOOKS_SUCCESS, data });
- const fetchBooksError = error => ({ type: FETCH_BOOKS_ERROR, error });
+ const fetchBooks = () => ({
+   type: FETCH_BOOKS,
+   request: {
+     url: '/books',
+     // you can put here other Axios config attributes, like method, data, headers etc.
+   },
+ });

- const defaultState = {
-   data: null,
-   pending: 0, // number of pending FETCH_BOOKS requests
-   error: null,
- };
-
- const booksReducer = (state = defaultState, action) => {
-   switch (action.type) {
-     case FETCH_BOOKS:
-       return { ...defaultState, pending: state.pending + 1 };
-     case FETCH_BOOKS_SUCCESS:
-       return { ...defaultState, data: action.data, pending: state.pending - 1 };
-     case FETCH_BOOKS_ERROR:
-       return { ...defaultState, error: action.error, pending: state.pending - 1 };
-     default:
-       return state;
-   }
- };
+ const booksReducer = requestsReducer({ actionType: FETCH_BOOKS });

- const fetchBooksApi = () => axios.get('/books');
-
- function* fetchBooksSaga() {
-   try {
-     const response = yield call(fetchBooksApi);
-     yield put(fetchBooksSuccess(response.data));
-   } catch (e) {
-     yield put(fetchBooksError(e));
-   }
- }
-
  function* rootSaga() {
-   yield takeEvery(FETCH_BOOKS, fetchBooksSaga);
+   yield createRequestInstance({ driver: createDriver(axios) });
+   yield watchRequests();
  }
```
With `redux-saga-requests`, you no longer need to define error and success actions to do things like error handling
or showing loading spinners. You don't need to write requests related repetitive sagas and reducers either.

Here you can see the list of features this library provides:
- you define your AJAX requests as simple actions, like `{ type: FETCH_BOOKS, request: { url: '/books' } }` and `success`,
`error` (`abort` is also supported, see below) actions will be dispatched automatically for you
- `success`, `error` and `abort` functions, which add correct and consistent suffixes to your request action types
(check [low-level-reducers example](https://github.com/klis87/redux-saga-requests/tree/master/examples/low-level-reducers)
to see how to use those functions in your reducers)
- `requestsReducer` higher order reducer, which takes requests related state management burden from your shoulders
- automatic request abort - when a saga is cancelled, a request made by it is automatically aborted and an abort action
is dispatched (especially handy with `takeLatest` and `race` Redux-Saga effects)
- sending multiple requests in one action - `{ type: FETCH_BOOKS_AND_AUTHORS, request: [{ url: '/books' }, { url: '/authors}'] }`
will send two requests and wrap them in `Promise.all`
- flexibility - you can use "auto mode" `watchRequests`
(see [basic example](https://github.com/klis87/redux-saga-requests/tree/master/examples/basic)),
or lower level `sendRequest`
(see [advanced example](https://github.com/klis87/redux-saga-requests/tree/master/examples/advanced)),
or... you could even access your request instance with `getRequestInstance`
- support for Axios and Fetch API - additional clients could be added, you could even write your own client
integration as a `driver` (see [./packages/redux-saga-requests-axios/src/axios-driver.js](https://github.com/klis87/redux-saga-requests/blob/master/packages/redux-saga-requests-axios/src/axios-driver.js)
for the example)
- mocking - mock driver, which use can use for test purposes or when you would like to integrate with API not yet implemented (and once API is finished, you could just change driver to Axios or Fetch and magicaly everything will work!)
- multiple driver support - for example you can use Axios for one part of your requests and Fetch Api for another part
- compatible with FSA, `redux-act` and `redux-actions` libraries (see [redux-act example](https://github.com/klis87/redux-saga-requests/tree/master/examples/redux-act-integration))
- simple to use with server side rendering - for example you could pass Axios instance to `createRequestInstance` and
you don't need to worry that Axios interceptors would be shared across multiple requests
- `onRequest`, `onSuccess`, `onError` and `onAbort` interceptors, you can attach your sagas (or simple functions)
to them to define a global behaviour for a given event type
- optional `requestsPromiseMiddleware`, which promisifies requests actions dispatch, so you can wait in your react components to get request response, the same way like you can do this with `redux-thunk`

## Installation [:arrow_up:](#table-of-content)

To install the package, just run:
```
$ yarn add redux-saga-requests
```
or...
```
$ npm install redux-saga-requests
```
or you can just use CDN: `https://unpkg.com/redux-saga-requests`.

Also, you need to install a driver:
- if you use Axios, install `axios` and `redux-saga-requests-axios`:

  ```
  $ yarn add axios redux-saga-requests-axios
  ```
  or...
  ```
  $ npm install axios redux-saga-requests-axios
  ```
  or CDN: `https://unpkg.com/redux-saga-requests-axios`.
- if you use Fetch API, install `isomorphic-fetch` (or a different Fetch polyfill) and `redux-saga-requests-fetch`:

  ```
  $ yarn add isomorphic-fetch redux-saga-requests-fetch
  ```
  or...
  ```
  $ npm install isomorphic-fetch redux-saga-requests-fetch
  ```
  or CDN: `https://unpkg.com/redux-saga-requests-fetch`.

Of course, because this is Redux-Saga addon, you also need to install Redux-Saga.

## Usage [:arrow_up:](#table-of-content)

For a basic usage, see [Motivation](#motivation-arrow_up) paragraph.

### `watchRequests`

As you probably guessed, the most job is done by `watchRequests`, which is like a manager to your request actions - it sends
requests you define in your actions and dispatches success, error and abort actions, depending on the outcome. It can also
automatically abort requests. Aborting requests is a very important, but often neglected topic. Lets say you have a
paginated list and a user asked for 1st page, then 2nd and lets assume response for 1st one will come later. Or... lets say a private
data are being fetched and before this request is finished a user logged out. You could introduce many race condition bugs like
this, without even realizing - they won't happen on your local machine (without throthling in your browser), but they could happen
on a production system, especially on a slow mobile internet, with a high latency. Because aborting is so important, you can pass
a config to `watchRequests` to adjust, how different actions will be aborted. This config has following attributes:
- `abortOn: string | string[] | action => boolean`: allows you to define actions, on which requests should be aborted, has the
same form which you can pass to `redux-saga` `take` effect, for example `'LOGOUT'`, `['LOGOUT']`,
`action => action.type === 'LOGOUT'`, default is `null`
- `takeLatest: boolean | action => boolean`: if `true`, when a new request will be dispatched while a pending of the same type is still running,
the previous one will be automatically aborted, default is `true` for `GET` requests and `false` for the rest ones
- `getLastActionKey: action => string`: a key generator to match actions of the same type, typically you won't need to adjust it,
but it might come in handy when you want some actions with the same `type` to be treated as a different one,
default is `action => action.type`.

So, for instance, you could do this:
```js
yield watchRequests({
  takeLatest: false,
  abortOn: 'LOGOUT',
});
```

Above defines a global behaviour, but what if you want to have different settings for different actions? You can use the same
config to adjust them per action type:
```js
yield watchRequests(
  { abortOn: 'LOGOUT' },
  {
    SAVE_STH_AND_DONT_ABORT_ACTION_WHEN_MULTIPLE: { takeLatest: false }
  }
);
```

Above will merge settings for `SAVE_STH_AND_DONT_ABORT_ACTION_WHEN_MULTIPLE` action with global ones, resulting in
`{ takeLatest: false, abortOn: 'LOGOUT' }` for `SAVE_STH_AND_DONT_ABORT_ACTION_WHEN_MULTIPLE` action.

Also, if you like the default behaviour, but just wanna change it for some actions, you can pass 1st param as `null`:
```js
yield watchRequests(
  null,
  {
    SAVE_STH_AND_DONT_ABORT_ACTION_WHEN_MULTIPLE: { takeLatest: false }
  }
);
```

Last, but not least, remember that `watchRequests` is a blocking effect, so if you have more sagas, use
`yield fork(watchRequests)`, or wrap it with something else in `all`:
```js
import { all, takeLatest, put } from 'redux-saga/effects';
import { createRequestInstance, watchRequests, success } from 'redux-saga-requests';
import { createDriver } from 'redux-saga-requests-axios';

function* fetchBooksSuccessSaga() {
  yield put(addMessage('Books have been loaded');
}

function* rootSaga() {
  yield createRequestInstance({ driver: createDriver(axios) });
  yield all([
    // put it before other sagas which handle requests, otherwise watchRequests might miss some requests...
    // or your sagas might miss requests actions, like success
    watchRequests(),
    takeLatest(success('FETCH_BOOK'), fetchBooksSuccessSaga),
  ]);
}
```

### `sendRequest`

Under the hood, `watchRequests` uses a lower level `sendRequest`. `watchRequests` should be flexible enough, so you won't need
to worry about `sendRequest`, but it is useful to know about it, it is handy in [Interceptors](#interceptors-arrow_up). Also, if you don't
like the magic of `watchRequests`, you might use it everywhere, or... you could write your own `watchRequests`!. This is how it
works:
```js
import axios from 'axios';
import { takeLatest } from 'redux-saga/effects';
import { createRequestInstance, sendRequest } from 'redux-saga-requests';
import { createDriver } from 'redux-saga-requests-axios'; // or a different driver

const FETCH_BOOKS = 'FETCH_BOOKS';

const fetchBooks = () => ({
  type: FETCH_BOOKS,
  request: { url: '/books' },
});

function* rootSaga() {
  yield createRequestInstance({ driver: createDriver(axios) });
  yield takeLatest(FETCH_BOOKS, sendRequest);
}
```
Now, if `/books` request is pending and another `fetchBooks` action is triggered, the previous request will be aborted
and `FETCH_BOOKS_ABORT` will be dispatched.

You could also use `race` effect:
```js
import axios from 'axios';
import { call, race, take, takeLatest } from 'redux-saga/effects';
import { createRequestInstance, sendRequest } from 'redux-saga-requests';
import { createDriver } from 'redux-saga-requests-axios'; // or a different driver

const FETCH_BOOKS = 'FETCH_BOOKS';
const CANCEL_REQUEST = 'CANCEL_REQUEST';

const fetchBooks = () => ({
  type: FETCH_BOOKS,
  request: { url: '/books' },
});

const cancelRequest = () => ({ type: CANCEL_REQUEST });

function* fetchBookSaga(fetchBookAction) {
  yield race([
    call(sendRequest, fetchBookAction),
    take(CANCEL_REQUEST),
  ]);
}

function* rootSaga() {
  yield createRequestInstance({ driver: createDriver(axios) });
  yield takeLatest(FETCH_BOOKS, fetchBookSaga);
}
```
In above case, not only the last `/books` request could be successful, but also it could be aborted with `cancelRequest`
action, as `sendRequest` would be aborted as it would lose with `take(CANCEL_REQUEST)` effect.

Of course, you can send requests directly also from your sagas:
```js
function* fetchBookSaga() {
  const { response, error } = yield call(
    sendRequest,
    fetchBooks(),
    { dispatchRequestAction: true },
  );

  if (response) {
    // do sth with response
  } else {
    // do sth with error
  }
}
```
The key here is, that you need to pass `{ dispatchRequestAction: true }` as second argument to `sendRequest`, so that `fetchBooks` action will be
dispatched - usually it is already dispatched somewhere else (from your React components `onClick` for instance),
but here not, so we must explicitely tell `sendRequest` to dispatch it.

### `getRequestInstance`

Also, it is possible to get access to your request instance (like Axios) in your Saga:
```js
import { getRequestInstance } from 'redux-saga-requests';

function* fetchBookSaga() {
  const requestInstance = yield getRequestInstance();
  /* now you can do whatever you want, for example, if u use axios:
  const response = yield call(requestInstance.get, '/some-url') */
}
```
You can do whatever you want with it, which gives you maximum flexibility. Typically it is useful in [Interceptors](#interceptors-arrow_up),
when you want to make some request directly, without using redux action - for redux action you would use `sendRequest`.

## Actions [:arrow_up:](#table-of-content)

No matter whether you use `watchRequests` or `sendRequest`, you only need to define request actions, which will trigger AJAX
calls for you, as well as dispatch success, error or abort actions. Lets say you defined a following request
action:
```js
const deleteBook = id => ({
  type: 'DELETE_BOOK',
  request: {
    url: `/books/${id}`,
    method: 'delete'
  },
  meta: { // meta is optional, it will be added to success, error or abort action when defined
    id,
  },
});
```

With this request action, assuming `id = 1`, following actions will be dispatched, depending on the request outcome:

### Successful response

```js
{
  type: 'DELETE_BOOK_SUCCESS',
  data: 'a server response',
  meta: {
    id: 1, // got from request action meta
    requestAction: {
      type: 'DELETE_BOOK',
      request: {
        url: '/books/1',
        method: 'delete'
      },
      meta: {
        id: 1,
      },
    },
  },
}
```

### Error response

```js
{
  type: 'DELETE_BOOK_ERROR',
  error: 'a server error',
  meta: {
    id: 1, // got from request action meta
    requestAction: {
      type: 'DELETE_BOOK',
      request: {
        url: '/books/1',
        method: 'delete'
      },
      meta: {
        id: 1,
      },
    },
  },
}
```

### Aborted request

```js
{
  type: 'DELETE_BOOK_ABORT',
  meta: {
    id: 1, // got from request action meta
    requestAction: {
      type: 'DELETE_BOOK',
      request: {
        url: '/books/1',
        method: 'delete'
      },
      meta: {
        id: 1,
      },
    },
  },
}
```

### Custom actions

If you don't like the way how success, error and abort are structured, it is possible to adjust them. You can change `_SUCCESS`, `_ERROR` and `_ABORT` default suffixes with `success`, `error` and `abort` in `createRequestInstance` config:

```js
import axios from 'axios';
import { getActionWithSuffix, watchRequests, createRequestInstance, createRequestsReducer } from 'redux-saga-requests';
import { createDriver } from 'redux-saga-requests-axios'; // or a different driver

const success = getActionWithSuffix('MY_SUCCESS_SUFFIX');
const error = getActionWithSuffix('MY_ERROR_SUFFIX');
const abort = getActionWithSuffix('MY_ABORT_SUFFIX');

function* rootSaga() {
  yield createRequestInstance({
    driver: createDriver(axios),
    success,
    error,
    abort,
  });
  yield watchRequests();
}
```

If you need even more control, you can define how the rest of actions payloads look like by passing
`successAction`, `errorAction`, `abortAction`, for example:
```js
const successAction = (action, data) => ({
  responseData: data,
  meta: {
    requestAction: action,
  },
});

function* rootSaga() {
  yield createRequestInstance({
    driver: createDriver(axios),
    successAction,
  });
  yield watchRequests();
}
```

## Reducers [:arrow_up:](#table-of-content)

Except for `watchRequests` and `sendRequest`, which can simplify your actions and sagas a lot, you can also use
`requestsReducer`, a higher order reducer, which is responsible for a portion of your state related to a given request type.
For a general idea how it works, see [Motivation](#motivation-arrow_up) paragraph. This is just a minimal example, where with simple:
```javascript
const reducer = requestsReducer({ actionType: `FETCH_SOMETHING` });
```
you already have a working reducer which will handle `FETCH_SOMETHING`, `FETCH_SOMETHING_SUCCESS`,
`FETCH_SOMETHING_ERROR` and `FETCH_SOMETHING_ABORT` actions, updating a following state attributes for you:
- `data`: here a data from your API will be kept, updated after `FETCH_SOMETHING_SUCCESS` is dispatched, initially
set to `null` (default) or `[]`, depending on `multiple` config attribute (see below)
- `error`: initially `null`, updated to a HTTP error after `FETCH_SOMETHING_ERROR` is dispatched
- `pending`: number of pending `FETCH_SOMETHING` requests, initially `0`, incremented by `1` for each `FETCH_SOMETHING`,
and decremented by `1` for each of `FETCH_SOMETHING_SUCCESS`, `FETCH_SOMETHING_ERROR`, `FETCH_SOMETHING_ABORT`
(implemeted as `integer`, not `boolean` due to possibility of multiple pending requests of the same type -
for example in a sequence `FETCH_SOMETHING`, `FETCH_SOMETHING`, `FETCH_SOMETHING_SUCCESS` we would set `pending`
to `false`, despite the fact 2nd `FETCH_SOMETHING` is still running, with `integer` `pending` will be set to `1`,
which for example allows you to easily write a selector like `showSpinner = pending => pending > 0`)

In order to be flexible, apart from `actionType` passed in `requestsReducer` config, optionally you can pass any of
following attributes:
- `multiple: boolean`: default to `false`, change it to `true` if you want your not loaded data to be stored as `[]`
instead of `null`
- `dataKey: string`: default to `'data'`, change it, if for some reason you want your data to be kept in a different key
- `errorKey: string`: default to `'error'`, change it, if for some reason you want your errors to be kept in a different key
- `pendingKey: string`: default to `'pending'`, change it, if for some reason you want your pending state to be kept in a different key
- `getData: (state, action, config) => data`: describes how to get data from `action` object, by default returns `action.data` or `action.payload.data` when action is FSA compliant
- `getError: (state, action, config) => data`: describes how to get error from `action` object, by default returns `action.error` or `action.payload` when action is FSA compliant
- `onRequest: (state, action, config) => nextState`: here you can adjust how `requestReducers` handles request actions
- `onSuccess: (state, action, config) => nextState`: here you can adjust how `requestReducers` handles success actions
- `onError: (state, action, config) => nextState`: here you can adjust how `requestReducers` handles error actions
- `onAbort: (state, action, config) => nextState`: here you can adjust how `requestReducers` handles abort actions
- `success: (actionType: string) => string`: override when using not standard success action suffix, handles `_SUCCESS` by default
- `error: (actionType: string) => string`: override when using not standard error action suffix, handles `_ERROR` by default
- `abort: (actionType: string) => string`: override when using not standard abort action suffix, handles `_ABORT` by default
- `resetOn: action => boolean or string[]`: callback or array of action types on which reducer will reset its state to initial one, for instance `['LOGOUT']` or `action => action.type === 'LOGOUT'`, `[]` by default

For example:
```js
const reducer = requestsReducer({ actionType: `FETCH_SOMETHING`, multiple: true });
```
which will keep your empty data as `[]`, not `null`.

For inspiration how you could override any of those attributes, see default config
[source](https://github.com/klis87/redux-saga-requests/blob/master/packages/redux-saga-requests/src/reducers.js#L19).

You might also want to adjust any configuration for all your requests reducers globally. Here is how you can do this:
```js
import { createRequestsReducer } from 'redux-saga-requests';

const requestsReducer = createRequestsReducer({ errorKey: 'fail' });
```
Now, instead of built-in `requestsReducer`, you can use your own one, and from now on all errors will be kept in `fail`
key in your state, not `error`.

If you need to have an additional state next to built-in state in `requestsReducer`, or additional actions you would like
it to handle, you can pass an optional custom reducer as a 2nd pararameter to `requestsReducer`:
```js
const activeReducer = (state = { active: false }, action) => {
  switch (action.type) {
    case `SET_ACTIVE`:
      return { ...state, active: true };
    case `SET_INACTIVE`:
      return { ...state, active: false };
    default:
      return state;
  }

const reducer = requestsReducer({ actionType }, activeReducer);
```
which effectively will merge `activeReducer` with `requestsReducer`, giving you initial state:
```js
const state = {
  data: null,
  error: null,
  pending: 0,
  active: false,
};
```
Basically, you can use `requestsReducer`, which will handle requests related logic in a configurable way with any custom
logic you need.

However, if `requestsReducer` seems too magical for you, this is totally fine, you can write your reducers in a standard
way too, but you might consider using `success`, `error` and `abort` helpers, which can add proper suffixes for you:
```js
import { success, error, abort } from 'redux-saga-requests';

const initialState = {
  data: null,
  fetching: false,
  error: false,
};

const FETCH_BOOKS = 'FETCH_BOOKS';

const booksReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_BOOKS:
      return { ...initialState, fetching: true };
    case success(FETCH_BOOKS):
      return {
        ...initialState,
        data: { ...action.data },
      };
    case error(FETCH_BOOKS):
      return { ...initialState, error: true };
    case abort(FETCH_BOOKS):
      return { ...initialState, fetching: false };
    default:
      return state;
  }
};
```

## Interceptors [:arrow_up:](#table-of-content)

You can add global handlers to `onRequest`, `onSuccess`, `onError` add `onAbort`, like so:
```js
import { sendRequest, getRequestInstance } from 'redux-saga-requests';

function* onRequestSaga(request, action) {
  // do sth with you request, like add token to header, or dispatch some action etc.
  return request;
}

function* onResponseSaga(response, action) {
  // do sth with the response, dispatch some action etc
  return response;
}

function* onErrorSaga(error, action) {
  // do sth here, like dispatch some action

  // you must return { error } in case you dont want to catch error
  // or { error: anotherError }
  // or { response: someRequestResponse } if you want to recover from error

  if (tokenExpired(error)) {
    // get driver instance, in our case Axios to make a request without Redux
    const requestInstance = yield getRequestInstance();

    try {
      // trying to get a new token
      const { data } = yield call(
        requestInstance.post,
        '/refreshToken',
      );

      saveNewToken(data.token); // for example to localStorage

      // we fire the same request again:
      // - with silent: true not to dispatch duplicated actions
      // - with runOnError: false not to call this interceptor again for this request
      return yield call(sendRequest, action, { silent: true, runOnError: false });

      /* above is a handy shortcut of doing
      const { response, error } = yield call(
        sendRequest,
        action,
        { silent: true, runOnError: false },
      );

      if (response) {
        return { response };
      } else {
        return { error };
      } */
    } catch(e) {
      // we didnt manage to get a new token
      return { error: e }
    }
  }

  // not related token error, we pass it like nothing happened
  return { error };
}

function* onAbortSaga(action) {
  // do sth, for example an action dispatch
}

function* rootSaga() {
  yield createRequestInstance({
    driver: createDriver(axios),
    onRequest: onRequestSaga,
    onSuccess: onResponseSaga,
    onError: onErrorSaga,
    onAbort: onAbortSaga,
  });
  yield watchRequest();
}
```

## FSA [:arrow_up:](#table-of-content)

If you like your actions to be compatible with
[Flux Standard Action](https://github.com/acdlite/flux-standard-action#flux-standard-action),
that's totally fine, you can define your request actions like:
```js
const fetchBooks = () => ({
  type: 'FETCH_BOOKS',
  payload: {
    request: {
      url: '/books',
    },
  },
  meta: { // optional
    someKey: 'someValue',
  },
});
```
Then, success, error and abort actions will also be FSA compliant. Moreover, `requestsReducer` will also correctly handle FSA actions.
For details, see [redux-act example](https://github.com/klis87/redux-saga-requests/tree/master/examples/redux-act-integration).

## Promise middleware [:arrow_up:](#table-of-content)

One disadvantage of using sagas is that there is no way to dispatch an action which triggers a saga from React component and
wait for this saga to complete. Because of this, integration with libraries like `Formik` are sometimes harder - for example you
are forced to push some callbacks to Redux actions for a saga to execute later, which is not convenient. Thats why this library gives
an optional `requestsPromiseMiddleware`:
```js
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { requestsPromiseMiddleware } from 'redux-saga-requests';

const sagaMiddleware = createSagaMiddleware();
const store = createStore(
  app,
  initialState,
  applyMiddleware(requestsPromiseMiddleware(), sagaMiddleware),
);
```

Now, lets say you defined an action:
```js
const fetchBooks = () => ({
  type: FETCH_BOOKS,
  request: { url: '/books'},
  meta: {
    asPromise: true,
  },
});
```

You can dispatch the action from a component and wait for a response:
```js
class Books extends Component {
  fetch = () => {
    this.props.fetchBooks().then(successAction => {
      // handle successful response
    }).catch(errorOrAbortAction => {
      // handle error or aborted request
    })
  }

  render() {
    // ...
  }
}
```

If you adjusted how response actions are structured, you might need to configure this middleware to fit your settings by passing an
optional config to `requestsPromiseMiddleware`:
```js
requestsPromiseMiddleware({
  success: customSuccessFunction,
  auto: true // if you with to promisify all request actions without explicit meta.asPromise true
  getRequestAction = action => action.meta && action.meta.requestAction ? action.meta.requestAction : null, // default
})
```

## Usage with Fetch API [:arrow_up:](#table-of-content)

All of the above examples show Axios usage, in order to use Fetch API, use below snippet:
```js
import 'isomorphic-fetch'; // or a different fetch polyfill
import { createRequestInstance, watchRequests } from 'redux-saga-requests';
import { createDriver } from 'redux-saga-requests-fetch';

function* rootSaga() {
  yield createRequestInstance({
    driver: createDriver(
      window.fetch,
      {
        baseURL: 'https://my-domain.com' // optional - it works like axios baseURL, prepending all relative urls
        AbortController: window.AbortController, // optional, if your browser supports AbortController or you use a polyfill like https://github.com/mo/abortcontroller-polyfill
      }
    ),
  });
  yield watchRequests();
}
```
And in order to create Fetch API requests, below:
```js
fetch('/users', {
  method: 'POST',
  body: JSON.stringify(data),
  headers: {
    'Content-Type': 'application/json',
  },
});
```
should be translated to this:
```javascript
const fetchUsers = () => ({
  type: 'FETCH_USERS',
  request: {
    url: '/users/',
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  }
});
```
The point is, you can use the same request config like you do with pure Fetch API, but you need to pass `url` in the
config itself. Also, one additional parameter you could provide in the config is `responseType`, which is set as `json`
as the default. Available response types are: `'arraybuffer'`, `'blob'`, `'formData'`, `'json'`, `'text'`, or `null`
(if you don't want a response stream to be read for the given response).

Also, this driver reads response streams automatically for you (depending on `responseType` you choose)
and sets it as `response.data`, so instead of doing `response.json()`, just read `response.data`.

## Mocking [:arrow_up:](#table-of-content)

Probably you are sometimes in a situation when you would like to start working on a feature which needs some integration with
an API. What you can do then? Probably you just wait or start writing some prototype which then you will polish once API is finished. You can do better with `redux-saga-requests-mock`, especially with multi driver support, which you can read about in the
next paragraph. With this driver, you can define expected responses and errors which you would get from server and write your app
normally. Then, after API is finished, you will just need to replace the driver with a real one, like Axios or Fetch API, without
any additional refactoring necessary, which could save you a lot of time!

You can use it like this:
```js
import { createRequestInstance, watchRequests } from 'redux-saga-requests';
import { createDriver } from 'redux-saga-requests-mock';

const FETCH_PHOTO = 'FETCH_PHOTO';

const fetchPhoto = id => ({
  type: FETCH_PHOTO,
  request: { url: `/photos/${id}` },
});

function* rootSaga() {
  yield createRequestInstance({
    driver: createDriver(
      {
        [FETCH_PHOTO]: (requestConfig, requestAction) => {
          // mock normal response for id 1 and 404 error fot the rest
          const id = requestConfig.url.split('/')[2];

          if (id === '1') {
            return {
              data: {
                albumId: 1,
                id: 1,
                title: 'accusamus beatae ad facilis cum similique qui sunt',
              },
            };
          }

          throw { status: 404 };
        },
      },
      {
        timeout: 1000, // optional, in ms, defining how much time mock request would take, useful for testing spinners
        getDataFromResponse: response => response.data // optional, if you mock Axios or Fetch API, you dont need to worry about it
      },
    ),
  });
  yield watchRequests();
}
```

## Multiple drivers [:arrow_up:](#table-of-content)

You can use multiple drivers if you need it. For example, if you want to use Axios by default, but also Fetch API
sometimes, you can do it like this:
```js
import axios from 'axios';
import 'isomorphic-fetch';
import { createRequestInstance, watchRequests } from 'redux-saga-requests';
import { createDriver as createAxiosDriver } from 'redux-saga-requests-axios';
import { createDriver as createFetchDriver } from 'redux-saga-requests-fetch';

function* rootSaga() {
  yield createRequestInstance({
    driver: {
      default: createAxiosDriver(axios),
      fetch: createFetchDriver(
        window.fetch,
        {
          baseURL: 'https://my-domain.com',
          AbortController: window.AbortController,
        },
      ),
    },
  });
  yield watchRequests();
}
```

As you can see, the default driver is Axios, so how to mark a request to be run by Fetch driver?
Just pass the key you assigned Fetch driver to (`fetch` in our case) in `action.meta.driver`, for instance:
```js
const fetchUsers = () => ({
  type: 'FETCH_USERS',
  request: {
    url: '/users/',
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  },
  meta: {
    driver: 'fetch',
  },
});
```

Also, if you want to use `getRequestInstance` with Fetch driver, just pass a proper driver key to it:
```js
import { getRequestInstance } from 'redux-saga-requests';

function* fetchBookSaga() {
  const requestInstance = yield getRequestInstance('fetch');
}
```

## Examples [:arrow_up:](#table-of-content)

I highly recommend to try examples how this package could be used in real applications. You could play with those demos
and see what actions are being sent with [redux-devtools](https://github.com/zalmoxisus/redux-devtools-extension).

There are following examples currently:
- [basic](https://github.com/klis87/redux-saga-requests/tree/master/examples/basic)
- [advanced](https://github.com/klis87/redux-saga-requests/tree/master/examples/advanced)
- [Fetch API](https://github.com/klis87/redux-saga-requests/tree/master/examples/fetch-api)
- [redux-act integration](https://github.com/klis87/redux-saga-requests/tree/master/examples/redux-act-integration)
- [low-level-reducers](https://github.com/klis87/redux-saga-requests/tree/master/examples/low-level-reducers)
- [mock-and-multiple-drivers](https://github.com/klis87/redux-saga-requests/tree/master/examples/mock-and-multiple-drivers)

## Credits [:arrow_up:](#table-of-content)

This library was inspired by [redux-axios-middleware](https://github.com/svrcekmichal/redux-axios-middleware)
(I highly recommend this library if someone doesn't use Redux-Saga!)
and [issue](https://github.com/redux-saga/redux-saga/issues/1117) in Redux-Saga, when it was recommended not to combine
another async middleware with sagas.

## Licence [:arrow_up:](#table-of-content)

MIT
