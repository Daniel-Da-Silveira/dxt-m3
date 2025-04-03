# Form statuses

## Key things we are designing for
The ability to specify : 

- Structure (format) & length a specific entry needs to meet
- Configure a specific validation message that is displayed when the format isn't adhered to

Additional Information

- Primary use would be for reference number entries (could be a combination of text + special characters)
- For our predefined question list, where possible we would look to use regex or ensure the appropriate format is configured
---
### Version 1

#### Page 1 for adding custom field validation
![form status tag in form editor pages v3](/app/design/assets/custom-field-validation_page1.png)
<br> *Process of adding custom field validation in which users can specify the length requirements for user input*

<br>

#### Page 2 for adding custom field validation
![form status tags v3](/app/design/assets/custom-field-validation_page2.png)
<br> *They can specify the letters/number requirements for each characters or still use Regex if inclined to. They can also add a custom validaiton message when errors occur*

<details>
  <summary>View character rule configurations</summary>

**Letters**
- To accept any letter from A to Z, enter “A-Z”
- To accept a specific range of letters, enter the first letter in the range followed by the last letter. For example, to accept letters only between C and G,  enter “C-G”.
- To accept more than one range of letters, separate each range with a comma. For example, “C-G, X-Y”. 
- To accept a specific letter, enter just the required letter on its own.

**Numbers**
- To include all numbers (0 to 9), enter "0-9".
- To include numbers only within a certain range, enter the starting number and the ending number with a dash between them. For example, for numbers from 4 to 6, enter "4-6".
- To include just one specific number, enter that number by itself.
  
</details>

#### Custom field validation - citizen view example
![form status tag in form editor pages v3](/app/design/assets/custom-field-validation-error-message.png)
<br> *Example of the types of custom validations users need and an custom validation messaging when users enter incompatible characters*


## What we learned
- the interface enabled content designers to avoid the very steep learning curve of using Regex and create their own custom field validation requirements
- additional need was identified to allow users to have more than one reange of letters in a single cell. For example, A-C, Y-Z

<br>
