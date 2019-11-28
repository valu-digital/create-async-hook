import React, { useState } from "react";

import {
    render,
    waitForElementToBeRemoved,
    fireEvent,
} from "@testing-library/react";
import { createAsyncHook } from "../src";

test("can show loading and content", async () => {
    async function doAsync() {
        return "async-result";
    }

    const useAsync = createAsyncHook(doAsync, {
        initialState: {
            foo: "",
        },
        update(state, res) {
            return {
                foo: res,
            };
        },
    });

    function Component() {
        const res = useAsync({});

        return (
            <div data-testid="content">
                {res.loading && "loading"}
                {!res.loading && res.state.foo}
            </div>
        );
    }

    const { getByTestId, getByText } = render(<Component />);

    expect(getByTestId("content").innerHTML).toEqual("loading");

    await waitForElementToBeRemoved(() => getByText("loading"));

    expect(getByTestId("content").innerHTML).toEqual("async-result");
});

test("can use fetcher args", async () => {
    async function doAsync(arg: string) {
        return "async-result:" + arg;
    }

    const useAsync = createAsyncHook(doAsync, {
        initialState: {
            foo: "",
        },
        update(state, res) {
            return {
                foo: res,
            };
        },
    });

    function Component() {
        const res = useAsync({ args: ["testarg"] });

        return (
            <div data-testid="content">
                {res.loading && "loading"}
                {!res.loading && res.state.foo}
            </div>
        );
    }

    const { getByTestId, getByText } = render(<Component />);

    expect(getByTestId("content").innerHTML).toEqual("loading");

    await waitForElementToBeRemoved(() => getByText("loading"));

    expect(getByTestId("content").innerHTML).toEqual("async-result:testarg");
});

test("can use variables in update", async () => {
    async function doAsync(arg: string) {
        return "async-result:" + arg;
    }

    const useAsync = createAsyncHook(doAsync, {
        initialState: {
            foo: "",
        },
        update(state, res, meta) {
            return {
                foo: "fromupdate:" + meta.args,
            };
        },
    });

    function Component() {
        const res = useAsync({ args: ["testarg"] });

        return (
            <div data-testid="content">
                {res.loading && "loading"}
                {!res.loading && res.state.foo}
            </div>
        );
    }

    const { getByTestId, getByText } = render(<Component />);

    expect(getByTestId("content").innerHTML).toEqual("loading");

    await waitForElementToBeRemoved(() => getByText("loading"));

    expect(getByTestId("content").innerHTML).toEqual("fromupdate:testarg");
});

test("variables change triggers fetch", async () => {
    const spy = jest.fn();
    async function doAsync(arg: string) {
        spy();
        return "async-result:" + arg;
    }

    const useAsync = createAsyncHook(doAsync, {
        initialState: {
            foo: "",
        },
        update(state, res, meta) {
            return {
                foo: res,
            };
        },
    });

    function Component() {
        const [state, setState] = React.useState("first");
        const res = useAsync({ args: [state] });

        return (
            <div>
                <button
                    data-testid="button"
                    onClick={() => {
                        setState("second");
                    }}
                >
                    click
                </button>
                <div data-testid="content">
                    {res.loading && "loading"}
                    {!res.loading && res.state.foo}
                </div>
            </div>
        );
    }

    const { getByTestId, getByText } = render(<Component />);

    expect(getByTestId("content").innerHTML).toEqual("loading");

    await waitForElementToBeRemoved(() => getByText("loading"));

    expect(getByTestId("content").innerHTML).toEqual("async-result:first");

    expect(spy).toHaveBeenCalledTimes(1);
    fireEvent(
        getByTestId("button"),
        new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        }),
    );

    expect(getByTestId("content").innerHTML).toEqual("loading");

    await waitForElementToBeRemoved(() => getByText("loading"));

    expect(getByTestId("content").innerHTML).toEqual("async-result:second");
    expect(spy).toHaveBeenCalledTimes(2);
});

test("variables are checked deeply", async () => {
    const spy = jest.fn();
    async function doAsync(variables: {
        deep: {
            value: string;
        };
    }) {
        spy();
        return "async-result:" + variables.deep.value;
    }

    const useAsync = createAsyncHook(doAsync, {
        initialState: {
            foo: "",
        },
        update(state, res, meta) {
            return {
                foo: res,
            };
        },
    });

    function Component() {
        const [state, setState] = React.useState({
            deep: {
                value: "value",
            },
        });

        const res = useAsync({ args: [state] });

        return (
            <div>
                <button
                    data-testid="button"
                    onClick={() => {
                        // Deeply the same value
                        setState({
                            deep: {
                                value: "value",
                            },
                        });
                    }}
                >
                    click
                </button>
                <div data-testid="content">
                    {res.loading && "loading"}
                    {!res.loading && res.state.foo}
                </div>
            </div>
        );
    }

    const { getByTestId, getByText } = render(<Component />);

    expect(getByTestId("content").innerHTML).toEqual("loading");

    await waitForElementToBeRemoved(() => getByText("loading"));

    expect(getByTestId("content").innerHTML).toEqual("async-result:value");

    expect(spy).toHaveBeenCalledTimes(1);

    fireEvent(
        getByTestId("button"),
        new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
        }),
    );

    expect(getByTestId("content").innerHTML).toEqual("async-result:value");
    expect(spy).toHaveBeenCalledTimes(1);
});