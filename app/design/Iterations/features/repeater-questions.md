# Repeater questions

## Key things we are designing for

- users able add another thing of the same type in a form
- add this pattern to a form in as little steps as possible

### Version 2 - Citizen facing
| What we've done  | Why we did it |
| ------------- | ------------- |
|  Added a check answer page after the last question and before the summary lists page, for complex items with many fields or with more than one question page |  Gives us the ability to meet the needs of more forms which would require more than one question page per item |
| Introduced a fixed cap for number of entries users can to forms in MVP | Until we have a save and return feature and/or spreadsheet upload, this is to protect users from losing the progress of their form |
| Decided that warning messages are needed to inform users that they need to do it in one sitting | So that users dont get timed out of their form |



[View an interactive prototype of version 2 where there is only one question page](https://www.figma.com/proto/1A9Tthy0CJeqp2rGNSKRjH/Defra-Form-Builder-flows?page-id=301%3A6853&type=design&node-id=540-24172&viewport=72229%2C18765%2C0.66&t=as93lDkAmGptg1Ye-1&scaling=scale-down&starting-point-node-id=540%3A24172&mode=design) 

[View and interactive prototype of version 2 where is more than one question per item](https://www.figma.com/proto/1A9Tthy0CJeqp2rGNSKRjH/Defra-Form-Builder-flows?page-id=301%3A6853&type=design&node-id=547-28857&viewport=72229%2C18765%2C0.66&t=as93lDkAmGptg1Ye-1&scaling=min-zoom&starting-point-node-id=547%3A28857&show-proto-sidebar=1&mode=design)

---

### Version 2 - Form designer facing

| What we've done  | Why we did it |
| ------------- | ------------- |
|  Configurations will happen on a seperate page to the form editor |  Adding repeater questions means essentially creating a form within a form so to avoid it getting mixed up with the main form pages, we decided to have this in a seperate page |
| Users will be able to decide which fields appear on summary list pages | When there are several fields within an item, it wouldn't be feasible to list them all on summary list pages. Therefore, giving users the ability to choose the most important ones was chosen. |
| Ability to specify a suffix on the summary list heading, add another button and item removal messaging | So that users know what they are adding or removing |

### Screens
[**View screens in Figma**](https://www.figma.com/file/1A9Tthy0CJeqp2rGNSKRjH/Defra-Form-Builder-flows?type=design&node-id=524-18950&mode=design&t=iWP6ZljjZAGkqQy8-4)

<br>

![form status tag in form editor pages v3](/app/design/assets/add-a-thing-form-designer-v2.svg)
  
---
### Version 1 - citizen facing
Designed in the context of the [support-attestation-costs-reimbursement-application form](https://www.gov.uk/government/publications/support-attestation-costs-reimbursement-application)

| What we've done  | Why we did it |
| ------------- | ------------- |
|  Use the [DWP 'Add another' pattern](https://design-system.dwp.gov.uk/patterns/add-another-thing) |  Pre-tested feature with the flexibility for adapting to any specific defra needs |
| Avoid in-line table editor patterns | Riddled with accessibility issues/|
| Spreadsheet upload will not fall part of MVP |  To start small and build up as the product becomes more sophisticated |

 <h3>
<details>
  <summary>view screens</summary>
  
  <h4>Page 1</h4>

![form status tag in form editor pages v3](/app/design/assets/multiple.png)

  <h4>Page 2: add another page </h4>

![form status tag in form editor pages v3](/app/design/assets/multiple-3.png)

  <h4>Page 3: item 2</h4>

![form status tag in form editor pages v3](/app/design/assets/multiple-1.png)

  <h4>Page 3: add another page</h4>

![form status tag in form editor pages v3](/app/design/assets/multiple-4.png)

> Cycle then repeats itself until stops adding items
  
</details>
</h3>

<br>

## What we learned
- not all questions will be on a single page so we need to incorporate DWP's pattern for more complex items
- save and return won't fall part of our MVP so we need to consider a limit of items users can add to avoid them being timed out and losing all their progress

<br>
