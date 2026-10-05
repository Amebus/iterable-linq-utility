---
"iterable-linq-utility": minor
---

New `reduceRight` Action: like `reduce`, from the last value to the first, as `Array.prototype.reduceRight`, with and without a seed. The reducer receives the index of each value in the source; the whole source is read first (#62).
