## Export meals to `json`

```js
var meals = await Meals.find({}, function (err, ret) {
    return ret;
});
console.log("\n\n");
console.log(JSON.stringify(meals));
console.log("\n\n");
```

and run:

```shell
make > output_file.json
```

pretty print:

```shell
python3 -m json.tool < output_file.json > output_file_pretty.json
```
