# NEXUS SDK Documentation

## Table of Contents

- [Introduction](#introduction)
- [Quickstart](#quickstart)
- [Fundamental Client](#fundamental-client)
- [Classification](#classification)
- [Regression](#regression)
- [Model Management](#model-management)
- [Error Handling](#error-handling)
- [Diagnostics](#diagnostics)

---

## Introduction

NEXUS is Fundamental's large model for tabular data. It delivers state-of-the-art performance on classification and regression tasks without manual feature engineering, hyperparameter tuning, or model selection.

The NEXUS SDK is a scikit-learn compatible Python client that lets you train, predict, and manage NEXUS models through a simple API:

- **Classification & Regression** - fit models and generate predictions with a familiar scikit-learn interface
- **Feature Importance** - understand which features drive model predictions
- **Model Management** - list, inspect, annotate, and delete trained models
- **sklearn Compatible** - NEXUS estimators implement the full scikit-learn estimator interface and work with pipelines, cross-validation, and other sklearn utilities out of the box
- **Diagnostics** - enable verbose logging to troubleshoot API calls, with sensitive values automatically redacted

Ready to start? See the [Quickstart](#quickstart) for a hands-on walkthrough.

---

## Quickstart

### Installation

**Requirements:** Python 3.10+

```bash
pip install fundamental-client
```

### Authentication

Authenticate with an API key to use the hosted Fundamental platform.

```python
from fundamental import Fundamental, set_client

# Option 1: Pass the key directly
client = Fundamental(api_key="your-api-key")
set_client(client)

# Option 2: Set the FUNDAMENTAL_API_KEY environment variable
# export FUNDAMENTAL_API_KEY=your-api-key
client = Fundamental()
set_client(client)
```

### Verify your setup

Run a quick test to confirm everything is working:

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from fundamental import NEXUSClassifier

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

clf = NEXUSClassifier()
clf.fit(X_train, y_train)
predictions = clf.predict(X_test)
print(predictions)
```

---

## Fundamental Client

Primary client for authenticating and configuring SDK requests.

Create a `Fundamental` instance with your API key and register it via `set_client` - all estimators will use it automatically, so you only need to configure the client once. All configuration parameters are forwarded to `Config`.

```python
class Fundamental(**kwargs)
```

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `config` | `Config` | Immutable SDK configuration. |
| `models` | `ModelService` | Model management service for listing, getting, deleting, and tagging trained models. |

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `api_key` | `str` | `FUNDAMENTAL_API_KEY` env var | API key for authentication. Defaults to the `FUNDAMENTAL_API_KEY` environment variable. |
| `api_url` | `str` | `FUNDAMENTAL_API_URL` env var or `https://api.fundamental.ai` | Base API URL. Defaults to the `FUNDAMENTAL_API_URL` environment variable, or `https://api.fundamental.ai`. |
| `retries` | `int` | `3` | Number of retries for failed requests. |
| `timeout` | `int` | `7` | Default request timeout in seconds. |
| `fit_timeout` | `int` | `18000` | Timeout for fit operations in seconds. |
| `predict_timeout` | `int` | `3600` | Timeout for predict operations in seconds. |
| `feature_importance_timeout` | `int` | `3600` | Timeout for feature importance operations in seconds. |
| `download_prediction_result_timeout` | `int` | `3600` | Timeout for downloading prediction results in seconds. |
| `download_feature_importance_result_timeout` | `int` | `3600` | Timeout for downloading feature importance results in seconds. |
| `verify_ssl` | `bool` | `True` | Whether to verify SSL certificates. |

> **Note:** Timeouts apply only to the processing phase, starting after the dataset upload has completed.

```python
from fundamental import Fundamental, set_client

client = Fundamental(api_key="your-api-key")
set_client(client)

# All estimators now use this client automatically
print(client.config.api_url)
```

### set_client

```python
from fundamental import set_client

set_client(client: BaseClient) -> None
```

Register a client as the global default for all estimators.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `client` | `BaseClient` | Client instance (e.g. `Fundamental` or `FundamentalAWSMarketplaceClient`). |

```python
from fundamental import Fundamental, NEXUSClassifier, set_client

client = Fundamental(api_key="your-api-key")
set_client(client)

# Estimators pick up the global client - no need to pass it explicitly
clf = NEXUSClassifier()
clf.fit(X_train, y_train)
```

### get_client

If no client has been set via `set_client`, creates and returns a default `Fundamental()` instance.

**Returns:** `BaseClient` - The current global client.

```python
from fundamental import get_client

client = get_client()
print(client.config.api_url)
```

---

## Classification

Scikit-learn compatible classifier powered by Fundamental's NEXUS model. Supports `fit`, `predict`, `predict_proba`, feature importance, async training via `submit_fit_task` / `poll_fit_result`, and async prediction via `submit_predict_task` / `submit_predict_proba_task` / `poll_predict_result`.

- It accepts `pandas.DataFrame` or `numpy.ndarray`.
- It accepts `numpy.ndarray` or `pandas.Series`.

Data must contain numeric types only - object dtypes, strings, mixed types, and complex numbers are not supported. Convert categorical data to numeric encoding before fitting. Missing values (NaN/Null) are handled natively.

```python
from fundamental import NEXUSClassifier

clf = NEXUSClassifier(mode="quality")
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | `"quality"` \| `"speed"` | `"quality"` | Training mode. `"quality"` optimizes for predictive performance, `"speed"` reduces training time. |

### fit

Fit the model to training data. Once fitted, the estimator is ready for `predict` calls.

Under the hood, fit submits the dataset for remote training and polls until the job completes. For non-blocking training, see `submit_fit_task`.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `X` | `DataFrame` \| `ndarray` | Training features as numpy array or pandas DataFrame of shape (n_samples, n_features). |
| `y` | `ndarray` \| `Series` | Training targets as numpy array or pandas Series of shape (n_samples,). |

**Returns:** `Self` - The fitted estimator, for method chaining.

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from fundamental import Fundamental, NEXUSClassifier, set_client

set_client(Fundamental(api_key="your-api-key"))

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

clf = NEXUSClassifier(mode="quality")
clf.fit(X_train, y_train)

print(clf.trained_model_id)  # save this to reuse the model later
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `TypeError` | `X` is not a DataFrame or ndarray, or `y` is not an ndarray or Series. |
| `ValueError` | Data is empty, or `X` and `y` have different number of samples. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ValidationError` | The server rejected the request data. |
| `RateLimitError` | The API rate limit was exceeded. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### predict

Generate predictions for the given features.

The model must be fitted first via `fit` or `load_model`.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `X` | `DataFrame` \| `ndarray` | Input features as numpy array or pandas DataFrame. |

**Returns:** `np.ndarray` - Predicted values or class labels.

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from fundamental import Fundamental, NEXUSClassifier, set_client

set_client(Fundamental(api_key="your-api-key"))

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

clf = NEXUSClassifier(mode="quality")
clf.fit(X_train, y_train)

predictions = clf.predict(X_test)
print(predictions[:5])
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFittedError` | The model has not been fitted yet. |
| `TypeError` | `X` is not a DataFrame or ndarray. |
| `ValueError` | Data is empty, or feature count doesn't match training data. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `RateLimitError` | The API rate limit was exceeded. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### predict_proba

Predict class probabilities for the given features. The model must be fitted first via `fit` or `load_model`. Returns an array of shape (n_samples, n_classes) with probability estimates for each class.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `X` | `DataFrame` \| `ndarray` | Input features as numpy array or pandas DataFrame. |

**Returns:** `np.ndarray` - Array of shape (n_samples, n_classes) with probability estimates.

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from fundamental import Fundamental, NEXUSClassifier, set_client

set_client(Fundamental(api_key="your-api-key"))

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

clf = NEXUSClassifier(mode="quality")
clf.fit(X_train, y_train)

probabilities = clf.predict_proba(X_test)
print(probabilities.shape)  # (n_samples, n_classes)
print(probabilities[:5])
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFittedError` | The model has not been fitted yet. |
| `TypeError` | `X` is not a DataFrame or ndarray. |
| `ValueError` | Data is empty, or feature count doesn't match training data. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `RateLimitError` | The API rate limit was exceeded. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### load_model

Load a previously trained model by its ID.

After loading, the estimator is ready for `predict` calls without retraining. Use `trained_model_id` from a previous fit to retrieve the ID.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `trained_model_id` | `str` | ID of the trained model to load. |

**Returns:** `Self` - The estimator with the loaded model, for method chaining.

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from fundamental import Fundamental, NEXUSClassifier, set_client

set_client(Fundamental(api_key="your-api-key"))

X, y = load_iris(return_X_y=True)
_, X_test, _, _ = train_test_split(X, y, test_size=0.2)

clf = NEXUSClassifier()
clf.load_model("your-trained-model-id")
predictions = clf.predict(X_test)
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFoundError` | The model ID does not exist. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### set_attributes

Set key-value metadata on a fitted model.

Useful for tagging models with version info, ownership, or deployment stage. Can also be done via `client.models.set_attributes` (see [Model Management](#model-management)).

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `attributes` | `dict[str, str]` | Key-value pairs to set. |

**Returns:** `Self` - Self for method chaining.

```python
clf.set_attributes({
    "version": "1.0",
    "team": "ml-ops",
    "stage": "production",
})
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFittedError` | The model has not been fitted yet. |
| `ValidationError` | The server rejected the attributes. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### Attributes (after fitting)

These attributes are available on the estimator after a successful `fit` or `load_model` call.

| Attribute | Type | Description |
|-----------|------|-------------|
| `fitted_` | `bool` | Whether the model has been fitted. |
| `trained_model_id_` | `str` | ID of the trained model. |
| `n_features_in_` | `int` | Number of features seen during fit. |
| `classes_` | `np.ndarray` | Unique class labels. |

### submit_fit_task

Submit a training job without blocking.

Returns a task ID that can be passed to `poll_fit_result` to check for completion. Use this instead of `fit` when you want to continue other work while training runs in the background.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `X` | `DataFrame` \| `ndarray` | Training features as numpy array or pandas DataFrame of shape (n_samples, n_features). |
| `y` | `ndarray` \| `Series` | Training targets as numpy array or pandas Series of shape (n_samples,). |

**Returns:** `str` - Task ID for use with `poll_fit_result`.

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from fundamental import Fundamental, NEXUSClassifier, set_client

set_client(Fundamental(api_key="your-api-key"))

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

clf = NEXUSClassifier(mode="quality")
task_id = clf.submit_fit_task(X_train, y_train)
print(task_id)  # save this to poll later
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `TypeError` | `X` is not a DataFrame or ndarray, or `y` is not an ndarray or Series. |
| `ValueError` | Data is empty, or `X` and `y` have different number of samples. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ValidationError` | The server rejected the request data. |
| `RateLimitError` | The API rate limit was exceeded. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### poll_fit_result

Check if a training job has completed.

Returns `Self` when training is done (the estimator is now fitted and ready for predictions), or `None` if still in progress.

Task IDs are portable - you can save a task ID and poll from a different session or even a different process. This makes it easy to submit a training job in one session and check on it later.

Task status is available for up to 48 hours after submission.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `task_id` | `str` | Task ID from `submit_fit_task`. |

**Returns:** `Optional[Self]` - Self if training is complete, None if still in progress.

```python
import time
from fundamental import Fundamental, NEXUSClassifier, set_client

set_client(Fundamental(api_key="your-api-key"))

# Can poll from a different estimator / session
clf = NEXUSClassifier()
result = clf.poll_fit_result(task_id)

while result is None:
    time.sleep(5)
    result = clf.poll_fit_result(task_id)

# Model is now fitted
predictions = clf.predict(X_test)
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ValidationError` | Training failed server-side validation. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### submit_predict_task

Submit a prediction job without blocking.

Returns a task ID that can be passed to `poll_predict_result` to check for completion. Use this instead of `predict` when you want to continue other work while prediction runs in the background.

The task ID can be polled from a different session or process - just load the same model via `load_model` first.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `X` | `DataFrame` \| `ndarray` | Input features as numpy array or pandas DataFrame of shape (n_samples, n_features). |

**Returns:** `str` - Task ID for use with `poll_predict_result`.

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from fundamental import Fundamental, NEXUSClassifier, set_client

set_client(Fundamental(api_key="your-api-key"))

X, y = load_iris(return_X_y=True)
_, X_test, _, _ = train_test_split(X, y, test_size=0.2)

clf = NEXUSClassifier()
clf.load_model("your-trained-model-id")

task_id = clf.submit_predict_task(X_test)
print(task_id)  # save this to poll later
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFittedError` | The model has not been fitted yet. |
| `TypeError` | `X` is not a DataFrame or ndarray. |
| `ValueError` | Data is empty, or feature count doesn't match training data. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ValidationError` | The server rejected the request data. |
| `RateLimitError` | The API rate limit was exceeded. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### submit_predict_proba_task

Submit a probability prediction job without blocking.

Returns a task ID that can be passed to `poll_predict_result` to check for completion.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `X` | `DataFrame` \| `ndarray` | Input features as numpy array or pandas DataFrame. |

**Returns:** `str` - Task ID for use with `poll_predict_result`.

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from fundamental import Fundamental, NEXUSClassifier, set_client

set_client(Fundamental(api_key="your-api-key"))

X, y = load_iris(return_X_y=True)
_, X_test, _, _ = train_test_split(X, y, test_size=0.2)

clf = NEXUSClassifier()
clf.load_model("your-trained-model-id")

task_id = clf.submit_predict_proba_task(X_test)
print(task_id)  # save this to poll later
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFittedError` | The model has not been fitted yet. |
| `TypeError` | `X` is not a DataFrame or ndarray. |
| `ValueError` | Data is empty, or feature count doesn't match training data. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `RateLimitError` | The API rate limit was exceeded. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### poll_predict_result

Check if a prediction job has completed.

Returns the prediction results when done, or `None` if still in progress.

Task IDs are portable - you can save a task ID and poll from a different session or even a different process. Just load the same model via `load_model` first so that `trained_model_id_` is available. Task status is available for up to 48 hours after submission.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `task_id` | `str` | Task ID from `submit_predict_task`. |

**Returns:** `Optional[np.ndarray]` - Prediction results if complete, None if still in progress.

```python
import time
from fundamental import Fundamental, NEXUSClassifier, set_client

set_client(Fundamental(api_key="your-api-key"))

# Can poll from a different estimator / session
clf = NEXUSClassifier()
clf.load_model("your-trained-model-id")

result = clf.poll_predict_result(task_id)
while result is None:
    time.sleep(5)
    result = clf.poll_predict_result(task_id)

print(result[:5])
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### get_feature_importance

Compute feature importance scores for each input feature.

Requires a fitted model via `fit` or `load_model`. For non-blocking computation, see `submit_feature_importance_task`.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `X` | `DataFrame` \| `ndarray` | Input features as numpy array or pandas DataFrame. |

**Returns:** `np.ndarray` - Feature importance scores.

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from fundamental import Fundamental, NEXUSClassifier, set_client

set_client(Fundamental(api_key="your-api-key"))

X, y = load_iris(return_X_y=True, as_frame=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

clf = NEXUSClassifier(mode="quality")
clf.fit(X_train, y_train)

importance = clf.get_feature_importance(X_train)

# Pair with column names for readability
for name, score in zip(X_train.columns, importance):
    print(f"{name}: {score:.4f}")
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFittedError` | The model has not been fitted yet. |
| `TypeError` | `X` is not a DataFrame or ndarray. |
| `ValueError` | Data is empty. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `RateLimitError` | The API rate limit was exceeded. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### submit_feature_importance_task

Submit a feature importance computation without blocking.

Requires a fitted model. Returns a task ID for use with `poll_feature_importance_result`.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `X` | `DataFrame` \| `ndarray` | Input features as numpy array or pandas DataFrame. |

**Returns:** `str` - Task ID for use with `poll_feature_importance_result`.

```python
task_id = clf.submit_feature_importance_task(X_train)
print(task_id)  # save this to poll later
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFittedError` | The model has not been fitted yet. |
| `TypeError` | `X` is not a DataFrame or ndarray. |
| `ValueError` | Data is empty. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `RateLimitError` | The API rate limit was exceeded. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### poll_feature_importance_result

Check if a feature importance job has completed.

Returns the importance scores array when done, or `None` if still in progress.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `task_id` | `str` | Task ID from `submit_feature_importance_task`. |

**Returns:** `Optional[np.ndarray]` - Feature importance scores if complete, None if still in progress.

```python
import time
from fundamental import Fundamental, NEXUSClassifier, set_client

set_client(Fundamental(api_key="your-api-key"))

# Can poll from a different estimator / session
clf = NEXUSClassifier()
clf.load_model("your-trained-model-id")

result = clf.poll_feature_importance_result(task_id)
while result is None:
    time.sleep(5)
    result = clf.poll_feature_importance_result(task_id)

print(result)  # array of importance scores
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFittedError` | The model has not been fitted yet. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

---

## Regression

Scikit-learn compatible regressor powered by Fundamental's NEXUS model. Supports `fit`, `predict`, feature importance, async training via `submit_fit_task` / `poll_fit_result`, and async prediction via `submit_predict_task` / `poll_predict_result`.

- It accepts `pandas.DataFrame` or `numpy.ndarray`.
- It accepts `numpy.ndarray` or `pandas.Series`.

Data must contain numeric types only - object dtypes, strings, mixed types, and complex numbers are not supported. Convert categorical data to numeric encoding before fitting. Missing values (NaN/null) are handled natively.

```python
from fundamental import NEXUSRegressor

reg = NEXUSRegressor(mode="quality")
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | `"quality"` \| `"speed"` | `"quality"` | Training mode. `"quality"` optimizes for predictive performance, `"speed"` reduces training time. |
| `time_series` | `bool` | `False` | Enable time-series mode. When True, row ordering is preserved during training and prediction. |

### fit

Fit the model to training data. Once fitted, the estimator is ready for `predict` calls.

Under the hood, fit submits the dataset for remote training and polls until the job completes. For non-blocking training, see `submit_fit_task`.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `X` | `DataFrame` \| `ndarray` | Training features as numpy array or pandas DataFrame of shape (n_samples, n_features). |
| `y` | `ndarray` \| `Series` | Training targets as numpy array or pandas Series of shape (n_samples,). |

**Returns:** `Self` - The fitted estimator, for method chaining.

```python
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from fundamental import Fundamental, NEXUSRegressor, set_client

set_client(Fundamental(api_key="your-api-key"))

X, y = load_diabetes(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

reg = NEXUSRegressor(mode="quality")
reg.fit(X_train, y_train)

print(reg.trained_model_id)  # save this to reuse the model later
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `TypeError` | `X` is not a DataFrame or ndarray, or `y` is not an ndarray or Series. |
| `ValueError` | Data is empty, or `X` and `y` have different number of samples. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ValidationError` | The server rejected the request data. |
| `RateLimitError` | The API rate limit was exceeded. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### predict

Generate predictions for the given features.

The model must be fitted first via `fit` or `load_model`.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `X` | `DataFrame` \| `ndarray` | Input features as numpy array or pandas DataFrame. |

**Returns:** `np.ndarray` - Predicted values or class labels.

```python
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from fundamental import Fundamental, NEXUSRegressor, set_client

set_client(Fundamental(api_key="your-api-key"))

X, y = load_diabetes(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

reg = NEXUSRegressor(mode="quality")
reg.fit(X_train, y_train)

predictions = reg.predict(X_test)
print(predictions[:5])
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFittedError` | The model has not been fitted yet. |
| `TypeError` | `X` is not a DataFrame or ndarray. |
| `ValueError` | Data is empty, or feature count doesn't match training data. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `RateLimitError` | The API rate limit was exceeded. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### load_model

Load a previously trained model by its ID.

After loading, the estimator is ready for `predict` calls without retraining. Use `trained_model_id` from a previous fit to retrieve the ID.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `trained_model_id` | `str` | ID of the trained model to load. |

**Returns:** `Self` - The estimator with the loaded model, for method chaining.

```python
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from fundamental import Fundamental, NEXUSRegressor, set_client

set_client(Fundamental(api_key="your-api-key"))

X, y = load_diabetes(return_X_y=True)
_, X_test, _, _ = train_test_split(X, y, test_size=0.2)

reg = NEXUSRegressor()
reg.load_model("your-trained-model-id")
predictions = reg.predict(X_test)
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFoundError` | The model ID does not exist. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### set_attributes

Set key-value metadata on a fitted model.

Useful for tagging models with version info, ownership, or deployment stage. Can also be done via `client.models.set_attributes` (see [Model Management](#model-management)).

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `attributes` | `dict[str, str]` | Key-value pairs to set. |

**Returns:** `Self` - Self for method chaining.

```python
reg.set_attributes({
    "version": "1.0",
    "team": "ml-ops",
    "stage": "production",
})
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFittedError` | The model has not been fitted yet. |
| `ValidationError` | The server rejected the attributes. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### Attributes (after fitting)

These attributes are available on the estimator after a successful `fit` or `load_model` call.

| Attribute | Type | Description |
|-----------|------|-------------|
| `fitted_` | `bool` | Whether the model has been fitted. |
| `trained_model_id_` | `str` | ID of the trained model. |
| `n_features_in_` | `int` | Number of features seen during fit. |

### submit_fit_task

Submit a training job without blocking.

Returns a task ID that can be passed to `poll_fit_result` to check for completion. Use this instead of `fit` when you want to continue other work while training runs in the background.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `X` | `DataFrame` \| `ndarray` | Training features as numpy array or pandas DataFrame of shape (n_samples, n_features). |
| `y` | `ndarray` \| `Series` | Training targets as numpy array or pandas Series of shape (n_samples,). |

**Returns:** `str` - Task ID for use with `poll_fit_result`.

```python
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from fundamental import Fundamental, NEXUSRegressor, set_client

set_client(Fundamental(api_key="your-api-key"))

X, y = load_diabetes(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

reg = NEXUSRegressor(mode="quality")
task_id = reg.submit_fit_task(X_train, y_train)
print(task_id)  # save this to poll later
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `TypeError` | `X` is not a DataFrame or ndarray, or `y` is not an ndarray or Series. |
| `ValueError` | Data is empty, or `X` and `y` have different number of samples. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ValidationError` | The server rejected the request data. |
| `RateLimitError` | The API rate limit was exceeded. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### poll_fit_result

Check if a training job has completed.

Returns `Self` when training is done (the estimator is now fitted and ready for predictions), or `None` if still in progress.

Task IDs are portable - you can save a task ID and poll from a different session or even a different process. This makes it easy to submit a training job in one session and check on it later.

Task status is available for up to 48 hours after submission.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `task_id` | `str` | Task ID from `submit_fit_task`. |

**Returns:** `Optional[Self]` - Self if training is complete, None if still in progress.

```python
import time
from fundamental import Fundamental, NEXUSRegressor, set_client

set_client(Fundamental(api_key="your-api-key"))

reg = NEXUSRegressor()
result = reg.poll_fit_result(task_id)

while result is None:
    time.sleep(5)
    result = reg.poll_fit_result(task_id)

# Model is now fitted
predictions = reg.predict(X_test)
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ValidationError` | Training failed server-side validation. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### submit_predict_task

Submit a prediction job without blocking.

Returns a task ID that can be passed to `poll_predict_result` to check for completion. Use this instead of `predict` when you want to continue other work while prediction runs in the background.

The task ID can be polled from a different session or process - just load the same model via `load_model` first.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `X` | `DataFrame` \| `ndarray` | Input features as numpy array or pandas DataFrame of shape (n_samples, n_features). |

**Returns:** `str` - Task ID for use with `poll_predict_result`.

```python
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from fundamental import Fundamental, NEXUSRegressor, set_client

set_client(Fundamental(api_key="your-api-key"))

X, y = load_diabetes(return_X_y=True)
_, X_test, _, _ = train_test_split(X, y, test_size=0.2)

reg = NEXUSRegressor()
reg.load_model("your-trained-model-id")

task_id = reg.submit_predict_task(X_test)
print(task_id)  # save this to poll later
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFittedError` | The model has not been fitted yet. |
| `TypeError` | `X` is not a DataFrame or ndarray. |
| `ValueError` | Data is empty, or feature count doesn't match training data. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ValidationError` | The server rejected the request data. |
| `RateLimitError` | The API rate limit was exceeded. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### poll_predict_result

Check if a prediction job has completed.

Returns the prediction results when done, or `None` if still in progress.

Task IDs are portable - you can save a task ID and poll from a different session or even a different process. Just load the same model via `load_model` first so that `trained_model_id_` is available. Task status is available for up to 48 hours after submission.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `task_id` | `str` | Task ID from `submit_predict_task`. |

**Returns:** `Optional[np.ndarray]` - Prediction results if complete, None if still in progress.

```python
import time
from fundamental import Fundamental, NEXUSRegressor, set_client

set_client(Fundamental(api_key="your-api-key"))

# Can poll from a different estimator / session
reg = NEXUSRegressor()
reg.load_model("your-trained-model-id")

result = reg.poll_predict_result(task_id)
while result is None:
    time.sleep(5)
    result = reg.poll_predict_result(task_id)

print(result[:5])
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### get_feature_importance

Compute feature importance scores for each input feature.

Requires a fitted model via `fit` or `load_model`. For non-blocking computation, see `submit_feature_importance_task`.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `X` | `DataFrame` \| `ndarray` | Input features as numpy array or pandas DataFrame. |

**Returns:** `np.ndarray` - Feature importance scores.

```python
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split
from fundamental import Fundamental, NEXUSRegressor, set_client

set_client(Fundamental(api_key="your-api-key"))

X, y = load_diabetes(return_X_y=True, as_frame=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

reg = NEXUSRegressor(mode="quality")
reg.fit(X_train, y_train)

importance = reg.get_feature_importance(X_train)

# Pair with column names for readability
for name, score in zip(X_train.columns, importance):
    print(f"{name}: {score:.4f}")
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFittedError` | The model has not been fitted yet. |
| `TypeError` | `X` is not a DataFrame or ndarray. |
| `ValueError` | Data is empty. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `RateLimitError` | The API rate limit was exceeded. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### submit_feature_importance_task

Submit a feature importance computation without blocking.

Requires a fitted model. Returns a task ID for use with `poll_feature_importance_result`.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `X` | `DataFrame` \| `ndarray` | Input features as numpy array or pandas DataFrame. |

**Returns:** `str` - Task ID for use with `poll_feature_importance_result`.

```python
task_id = reg.submit_feature_importance_task(X_train)
print(task_id)  # save this to poll later
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFittedError` | The model has not been fitted yet. |
| `TypeError` | `X` is not a DataFrame or ndarray. |
| `ValueError` | Data is empty. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `RateLimitError` | The API rate limit was exceeded. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### poll_feature_importance_result

Check if a feature importance job has completed.

Returns the importance scores array when done, or `None` if still in progress.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `task_id` | `str` | Task ID from `submit_feature_importance_task`. |

**Returns:** `Optional[np.ndarray]` - Feature importance scores if complete, None if still in progress.

```python
import time
from fundamental import Fundamental, NEXUSRegressor, set_client

set_client(Fundamental(api_key="your-api-key"))

# Can poll from a different estimator / session
clf = NEXUSRegressor()
clf.load_model("your-trained-model-id")

result = clf.poll_feature_importance_result(task_id)
while result is None:
    time.sleep(5)
    result = clf.poll_feature_importance_result(task_id)

print(result)  # array of importance scores
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `NotFittedError` | The model has not been fitted yet. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

---

## Model Management

Manage trained models through the `client.models` service.

Use this to list, inspect, annotate, and delete models independently of the estimator that created them.

### client.models.list

List all trained models.

**Returns:** `TrainedModelListResponse` - List of trained model metadata.

```python
model_list = client.models.list()
print(model_list)  # [{"model_id": "model_ab", ...}, ...]
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### client.models.get

Retrieve metadata for a trained model.

Returns the model's ID and any user-defined attributes.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `model_id` | `str` | The ID of the model to retrieve. |

**Returns:** `TrainedModelMetadata` - Object with `trained_model_id` (`str`) and `attributes` (`dict[str, str]`) `Attributes`.

```python
metadata = client.models.get("your-model-id")
print(metadata.trained_model_id)
print(metadata.attributes)
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `ValidationError` | `model_id` is empty. |
| `NotFoundError` | The model ID does not exist. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### client.models.delete

Permanently delete a trained model.

This action cannot be undone - the model will no longer be available for predictions or loading via `load_model`.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `model_id` | `str` | The ID of the model to delete. |

**Returns:** `DeleteTrainedModelResponse` - Response with `message`, `trained_model_id`, and `user_id` attributes.

```python
response = client.models.delete("your-model-id")
print(response.message)
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `ValidationError` | `model_id` is empty. |
| `NotFoundError` | The model ID does not exist. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

### client.models.set_attributes

Set key-value metadata on a trained model.

Useful for tagging models with version info, ownership, or deployment stage. This can also be done directly on a fitted estimator via `clf.set_attributes(...)` (see [Classification](#classification) / [Regression](#regression)).

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `model_id` | `str` | The ID of the model to update. |
| `attributes` | `dict[str, str]` | Key-value pairs to set. |

**Returns:** `UpdateAttributesResponse` - Object with `attributes` (`dict[str, str]`) - the updated attributes.

```python
client.models.set_attributes("your-model-id", {
    "team": "Research, Finance AI",
    "stage": "production",
    "owner": "ml-ops-team",
})
```

#### Possible exceptions

| Exception | Condition |
|-----------|-----------|
| `ValidationError` | `model_id` is empty. |
| `AuthenticationError` | The API key is invalid or missing. |
| `AuthorizationError` | The account has insufficient permissions. |
| `ServerError` | A server-side error occurred. |
| `NetworkError` | A network connectivity issue occurred. |
| `RequestTimeoutError` | The request timed out. |

---

## Error Handling

### Exception Reference

| Exception | Status Code | Description |
|-----------|-------------|-------------|
| `NEXUSError` | - | Base exception for all NEXUS client errors. |
| `HTTPError` | varies | Base class for HTTP errors with status codes. |
| `ValidationError` | 400 | Raised when input validation fails (HTTP 400). |
| `AuthenticationError` | 401 | Raised when authentication fails (HTTP 401). |
| `AuthorizationError` | 403 | Raised when authorization fails (HTTP 403). |
| `NotFoundError` | 404 | Raised when a resource is not found (HTTP 404). |
| `RateLimitError` | 429 | Raised when API rate limits are exceeded (HTTP 429). |
| `ServerError` | 500 | Raised when the server returns a 5xx error. |
| `NetworkError` | 503 | Raised when a network connectivity issue occurs (HTTP 503). |
| `RequestTimeoutError` | 504 | Raised when a request times out (HTTP 504). |

### Exception Attributes

All exceptions carry these attributes:

| Attribute | Type | Description |
|-----------|------|-------------|
| `details` | `dict` | Additional error context (may be empty). |
| `trace_id` | `str` or `None` | Unique request ID for support diagnostics. |

The error message is accessible via `str(e)` or `e.args[0]`.

### Imports

All exceptions are importable from `fundamental.exceptions`:

```python
from fundamental.exceptions import (
    NEXUSError,
    HTTPError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    RateLimitError,
    ServerError,
    NetworkError,
    RequestTimeoutError,
)
```

---

## Diagnostics

The SDK includes built-in diagnostics for debugging issues. When activated, it logs detailed debug information to a file and prints key events to the console - with automatic secret masking.

### activate

Enable diagnostics globally.

Creates a timestamped log file (`fundamental_debug_YYYYMMDD_HHMMSS.log`) in the specified directory. Subsequent calls are ignored if diagnostics are already active.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `log_dir` | `str` or `None` | System temp directory | Directory for the log file. |

**Returns:** `None`

```python
from fundamental.diagnostics import activate

activate()           # logs to system temp directory
activate(log_dir="./logs")  # or specify a custom directory
```

### deactivate

Disable diagnostics and clean up logging handlers.

No-op if diagnostics are not active.

**Returns:** `None`

```python
from fundamental.diagnostics import activate, deactivate

activate()
# ... run SDK operations ...
deactivate()
```

### diagnose

Context manager that activates diagnostics for a scoped block.

Automatically deactivates on exit. If an exception occurs inside the block, diagnostics captures an enhanced report (including traceback, SDK version, platform info, and trace ID) before re-raising the exception.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `log_dir` | `str` or `None` | System temp directory | Directory for the log file. |

```python
from fundamental.diagnostics import diagnose

with diagnose(log_dir="./logs"):
    clf.fit(X_train, y_train)
    predictions = clf.predict(X_test)

# Diagnostics are automatically deactivated after the block.
# If an error occurs, an enhanced report is written to the log file.
```
