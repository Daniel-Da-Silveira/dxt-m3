# Report the location of something

## Key things we are designing for
- Ability for a user to locate a location on an interactive map
- Ability for a user to select a particular location on the interactive map and the following information is captured / can be transmitted : 
- Geographic co-ordinates
- Grid Reference
- City, Postcode / Road Information
- Ability to allow a user to specify location using address, grid reference or co-ordinates

## Version 3

| What we've done  | Why we did it |
| ------------- | ------------- |
|  Added address lookup feature |  So users can set the initial view of the map to a location of their choosing. |
| Ability to set the initial view to your current GPS location | To allow users that are at the location to quickly access their GPS coordinates on the map |
|Show the location of the pin semantically, below the map |   To avoid using innaccessible map overlays |
|Give users the chance to double check that their selection is as they've intended | To help users have confidence in their answers by showing them a page with their selection and the opportunity to change it before carrying on |
|Grid reference | Added a link to UK grid finder page with hint text to allow us to test our assumption that this is helpful for users |

<h4>Maps</h4>

- **Flow A:** Screen 1 -Enter postcode (address lookup) > Screen 2 - Set a pin on the desired location ((can opt to try a different method)) > Screen 3 - confirm location selection ((can go back and change selection))

- **Flow B:** Screen 1 - Use current location (browser GPS popup) > Screen 2 - Map defaults to current location, user can move the location of the a pin ((can opt to try a different method)) > Screen 3 - confirm location selection ((can go back and change selection))

- **Flow C:** Screen 1 - Search on map > Screen 2 - Map defaults to zoomed out view of United Kingdom location, user can move the location of the a pin ((can opt to try a different method)) > Screen 3 - confirm location selection ((can go back and change selection))

<h4>Find address</h4>

- **Flow A:** Screen 1 - Enter postcode,and or building number or name ((can choose to enter address manuall*y)) > Screen 2 - confirm select an address ((can go back to search again or enter address manually))> Screen 3 - confirm address ((can go back to search again or enter address manually))

*Screen for entering address manually

<h4>Grid reference</h4>

- **Flow A:** Screen 1 - Enter grid reference > Screen 2 - confirm grid reference ((can go back and change selection or method))

<h4>Coordinates</h4>

- **Flow A:** Screen 1 - Enter coordinates > Screen 2 - confirm coordinates ((can go back and change selection or method))
<br>

> - [**View interactive V3 prototype- used in the context of the Report a dead wild bird service**](https://www.figma.com/proto/bH9CYNoBAS2et673V9Z81N/Report-a-wild-dead-bird_as-is?page-id=6%3A23&type=design&node-id=916-8484&viewport=-672%2C-59%2C0.12&t=QLXgqJMbnR8rputW-1&scaling=scale-down-width&starting-point-node-id=916%3A8484&show-proto-sidebar=1&mode=design)

> - [**View v3 screens**](https://www.figma.com/file/1A9Tthy0CJeqp2rGNSKRjH/Defra-Form-Builder-flows?type=design&node-id=1750-87539&mode=design&t=iWP6ZljjZAGkqQy8-4)
<br>

## What we learned
- add UR summary or link to summary deck

<br>

<h2>form designer view for configuring the location pattern v3</h2>

![form designer view for configuring the location pattern v3](/app/design/assets/location-pattern_form-designer.png)

## What we learned
- users were happy with the ability modify the pattern to their needs and address lookup was a much welcomed feature
