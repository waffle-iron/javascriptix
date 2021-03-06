(function (t$) {
    
    function simpleEquals(o1, o2) {
        return o1 === o2;
    }

    function assertEquals(obj1, obj2, equals = simpleEquals) {
        if (!equals(obj1, obj2)) {
            throw new Error(`Assertion failed. [${obj1}] not equal to [${obj2}]`);
        }
    }

    function arrayEquals(arr1, arr2, equals = simpleEquals) {
        if (arr1 === arr2) {
            return true;
        }
        if (!arr1 || !arr2 || arr1.length !== arr2.length) {
            return false;
        }
        for (let i = 0; i < arr1.length; i++) {
            if (!equals(arr1[i], arr2[i])) {
                return false;
            }
        }
        return true;
    }
    
    function assertErrorThrown(func, args) {
        try {
            func(args);
            throw new Error("assertion failed");
        } catch (e) {}
    }
    
    function createElement(type, text, id) {
        let element = document.createElement(type);
        element.id = id;
        element.textContent = text;
        return element;
    }
    
    function createReport() {
        let report = createElement('DIV');
        let title = createElement('H3', 'Results:');
        report.appendChild(title);
        return report;
    }
    
    function toggle(id) {
        let element = document.getElementById(id);
        if (element) {
            element.classList.toggle('hidden');
        }
    }
    
    function addTestSuiteTitle(appendTo, tsId, text) {
        let title = createElement('H4', text, tsId + "-header");
        title.addEventListener("click", () => toggle(tsId));
        appendTo.appendChild(title);
        return title;
    }
    
    function addTestSuiteSection(appendTo, tsId) {
        let section = createElement('DIV', null, tsId);
        appendTo.appendChild(section);
        return section;
    }

    function addTestSummary(appendTo, test, success = true) {
        let result = test + (success ? ' - PASSED.' : ' - FAILED!');
        let summary = createElement('P', result);
        summary.classList.add('result');
        summary.classList.add(success ? 'normal' : 'failed');
        appendTo.appendChild(summary);
    }
    
    function addTestDetails(appendTo, err) {
        let fileName = err.fileName ? err.fileName.substr(err.fileName.lastIndexOf('/') + 1) : 'unknown';
        let details = createElement('P', `${detail} - ${fileName} (line  ${err.lineNumber})`);
        details.classList.add('details');
        appendTo.appendChild(details);
    }
    
    function runTests(testSuite, section) {
        let [count, countFailed] = [0, 0];
        for (let test in testSuite) {
            if (testSuite[test] instanceof Function) {
                try {
                    testSuite[test]();
                    addTestSummary(section, test);
                } catch (err) {
                    addTestSummary(section, test, false);
                    addTestDetails(section, err);
                    countFailed++;
                }
                count++;
            }
        }
        return [count, countFailed];
    }
    
    function runTestSuites(testSuites) {
        testSuites.forEach((testSuite, i) => {
            let tsId = "ts" + i;
            let tsTitle = addTestSuiteTitle(report, tsId, testSuite.name);
            let tsSection = addTestSuiteSection(report, tsId);
            
            let [total, failed] = runTests(testSuite, tsSection);
            if (!failed) {
                tsTitle.classList.add('passed');
                tsTitle.textContent += ` - PASSED (${total} tests)`;
                tsTitle.click();
            } else {
                tsTitle.textContent += ` - FAILED (${failed} out of ${total}tests)`;
                tsTitle.classList.add('failed');
            }
        });
    }
    
    const report = createReport();
    window.j$.init.bash();
    
    t$.assertEquals = assertEquals;
    t$.arrayEquals = arrayEquals;
    t$.runTestSuites = runTestSuites;
    t$.assertErrorThrown = assertErrorThrown;
    
    t$.init = function () {
        document.body.appendChild(report);
    };
    
}(window.t$ = window.t$ || {}));