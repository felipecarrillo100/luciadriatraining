
class HandleHTTPErrors {
    private defaultMessage: string;
    private useProxy: boolean;
    private callbackOnError: any;

    constructor(defaultMessage:string, useProxy: boolean, callbackOnError?: any) {
        this.defaultMessage = defaultMessage;
        this.useProxy = typeof useProxy !== "undefined" ? useProxy : false;
        this.callbackOnError = callbackOnError;
    }

    // handleError = (e:any) => {
    //     if (typeof this.callbackOnError === "function") {
    //         this.callbackOnError(e);
    //     }
    //     const message = this.httpErrorDictionary(e);
    //     ScreenMessage.error(message);
    // }

    httpErrorDictionary = (e: any) => {
        if (e.code===400) {
            return "Bad request";
        } else if (e.code===401) {
            if (this.useProxy) {
                return "You are currently not logged in. Try \"Login again\" from the Session menu";
            } else {
                return "Authentication credentials required";
            }
        } else if (e.code===403) {
            return "Verify that your credentials are valid";
        } else if (e.code===404) {
            return "Resource not found in server. Verify the endpoint url";
        } else if (e.code===0) {
             return JSON.stringify(e.message);
        } else {
            return this.defaultMessage;
        }
    }
}

export default HandleHTTPErrors;
