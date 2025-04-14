class Annotations {
    constructor() {
        this.annotations = [];
        this.attributeTypes = [];
        this.attributeTypesSet = false;
        this.latestKonvaActions = [];
    }
    
    getAnnotations() {
        return this.annotations;
    }

    getAttributeTypes() {
        return this.attributeTypes;
    }

    getAnnotationIndexById(id) {
        if (!id || typeof id !== "string") {
            return null;
        }
        for (const key of Object.keys(this.annotations)) {
            if (this.annotations[key].annotationId === id || this.annotations[key].id === id) {
                return key;
            }
        }
        return null;
    }
    
    setAnnotations(annotations) {
        if (!annotations || annotations === "") {
            return;
        }
        this.annotations = typeof annotations === "string" ? JSON.parse(annotations) : annotations;
        if (this.attributeTypesSet === false && this.annotations[0] && this.annotations[0].attributes) {
            this.attributeTypes = this.annotations[0].attributes;
            this.attributeTypesSet = true;
            window.dispatchEvent(new Event("attributesupdate"));
        } 
    }

    setAttributeTypes(response) {
        if (!response || response === "") return;
        this.attributeTypes = typeof response === "string" ? JSON.parse(response).attributeTypes : response.attributeTypes;
        this.attributeTypesSet = true;
        window.dispatchEvent(new Event("attributesupdate"));
    }

    deleteAllAnnotations() {
        this.annotations = [];
        this.latestKonvaActions = [];
    }

    deleteAnnotations(url) {
        if (typeof url !== "string") return;
        const queryParameters = url.split("=")[1];
        const IDsArray = queryParameters.split(",");
        const length = this.latestKonvaActions.push({
            type: "delete",
            affectedAnnotations: []
        })
        for (const id of IDsArray) {
            const annotationIndex = this.getAnnotationIndexById(id);
            if (annotationIndex !== null) {
                this.latestKonvaActions[length - 1].affectedAnnotations.push(
                    structuredClone(this.annotations[annotationIndex])
                );
                this.annotations.splice(annotationIndex, 1);
            }
        }
        if (length >= 5) {
            this.latestKonvaActions.shift();
        }
    }

    patchAnnotation(annotation, requestURL) {
        if (!annotation || annotation === "") return;
        if (typeof annotation === "string") {
            annotation = JSON.parse(annotation);
        }
        const annotationId = this.getAnnotationIdFromRequestURL(requestURL);
        const annotationIndex = this.getAnnotationIndexById(annotationId);
        const length = this.latestKonvaActions.push({
            type: "draw",
            affectedAnnotations: []
        });
        if (annotationIndex !== null) {
            this.annotations[annotationIndex] = annotation;
        } else {
            this.latestKonvaActions[length - 1].affectedAnnotations.push(
                structuredClone(annotation)
            );
            this.annotations[this.annotations.length] = annotation;
        }
        if (length >= 5) {
            this.latestKonvaActions.shift();
        }
    }

    patchAnnotationsLabel(requestBody) {
        if (typeof requestBody === "string") {
            requestBody = JSON.parse(requestBody);
        }
        const length = this.latestKonvaActions.push({
            type: "labelPatch",
            affectedAnnotations: []
        });
        for (const id of requestBody.ids) {
            const index = this.getAnnotationIndexById(id);
            this.latestKonvaActions[length - 1].affectedAnnotations.push(
                structuredClone(this.annotations[index])
            );
            this.annotations[index].label = requestBody.label;
        }
        if (length >= 5) {
            this.latestKonvaActions.shift();
        }
    }

    patchAnnotationPoints(requestBody, requestURL) {
        if (!requestBody || requestBody === "") return;
        if (typeof requestBody === "string") {
            requestBody = JSON.parse(requestBody);
        }
        const annotationId = this.getAnnotationIdFromRequestURL(requestURL);
        const index = this.getAnnotationIndexById(annotationId);
        const length = this.latestKonvaActions.push({
            type: "pointsPatch",
            affectedAnnotations: []
        });
        if (index !== null && requestBody.points !== null) {
            this.latestKonvaActions[length - 1].affectedAnnotations.push(
                structuredClone(this.annotations[index])
            );
            this.annotations[index].points = requestBody.points;
        }
        if (length >= 5) {
            this.latestKonvaActions.shift();
        }
    }
    
    patchAnnotationsAttribute(body) {
        if (!body || body === "") return;
        if (typeof body === "string") {
            body = JSON.parse(body);
        }
        for (const annotationKey of Object.keys(this.annotations)) {
            if (this.annotations[annotationKey].attributes && this.annotations[annotationKey].attributes[0].id === body.id) {
                for (let i = 0; i < body.values.length; ++i) {
                    if (body.values[i] === "true" && this.annotations[annotationKey].attributes[0].values) {
                        this.annotations[annotationKey].attributes[0].values[i] = body.values[i];
                        continue;
                    }
                    if (body.values[i] === "true") {
                        this.annotations[annotationKey].attributes[0].values = [body.values[i]];
                        continue;
                    }
                    if (body.values[i] === "false") {
                        this.annotations[annotationKey].attributes[0].values.splice(i, 1);
                        continue;
                    }
                }
                break;
            }
        }
    }

    getAttributesObject(target) {
        if (!target) {
            if (!this.annotations[0]) {
                return
            }
            return this.annotations[0].attributes;
        }
        const annotationId = target.parent.attrs.id;
        const annotationIndex = this.getAnnotationIndexById(annotationId);
        if (annotationIndex !== null) {
            return this.annotations[annotationIndex].attributes;
        }
        return null;
    }
    
    getAnnotationIdFromRequestURL(requestURL) {
        const requestURLParts = requestURL.split("/");
        const annotationId = requestURLParts[requestURLParts.length - 1];
        return annotationId;
    }

    /**
     * @param {XMLHttpRequest} XMLHttpRequest 
     * @param {string} requestMethod 
     * @param {string} requestURL 
     */
    handleInterceptedGETRequest(XMLHttpRequest, requestURL, projectName) {
        if (requestURL.includes("/annotations") === true && XMLHttpRequest.response) {
            const response = JSON.parse(XMLHttpRequest.response);
            if (response[0] !== undefined && typeof response[0] === "object") {
                this.setAnnotations(response);
                return;
            }
        }
        if (requestURL.includes("/annotations/") === true && XMLHttpRequest.response) {
            this.patchAnnotation(XMLHttpRequest.response, requestURL);
            return;
        }
        if (requestURL.includes(`image-annotations/`) === true && JSON.parse(XMLHttpRequest.response).annotations) {
            this.setAnnotations(JSON.parse(XMLHttpRequest.response).annotations);
            return;
        }
        const regexString = `^/api/projects/${projectName}$`;
        if (requestURL.match(regexString) !== null && XMLHttpRequest.response) {
            this.setAttributeTypes(XMLHttpRequest.response);
            return;
        }
    }

    handleInterceptedPATCHRequest(XMLHttpRequest, requestBody, requestURL) {
        if (requestURL.includes("/attributes") === true) {
            this.patchAnnotationsAttribute(requestBody);
            return;
        }
        if (requestURL.includes("/annotations") === true && typeof JSON.parse(requestBody).label === "string" && Array.isArray(JSON.parse(requestBody).ids) === true) {
            this.patchAnnotationsLabel(requestBody);
            return;
        }
        if (requestURL.includes("/annotations/") === true) {
            this.patchAnnotationPoints(requestBody, requestURL);
            return;
        }
    }

    handleInterceptedDELETERequest(XMLHttpRequest, requestBody, requestURL) {
        if (requestURL.includes("/annotations?") === true) {
            this.deleteAnnotations(requestURL);
            return;
        }
    }
}

export {Annotations};