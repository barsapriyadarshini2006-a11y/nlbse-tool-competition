# Manual Validation of the security indicators 

In the work of Croft *et al.* (2023 - An empirical study of developers’ discussions about security challenges of different programming languages) at set of 288 keywords which can indicate an issue regarding the security are presented (SecI). As the authors by themself have noted that those security indicators might be quite general, we performed a manual inspection of them.

## Manual Inspection

We have extracted for each of SecI which occurred at least three times among all the function in MADE-WIC. In total, 351 instances of source code containing at least one security indicator have been inspected. Three authors have manually inspected the comments with the SecI in the context of the function. Later, the three authors had a discussion on each of the instance, in which they could elaborate why they have selected one labelling, if the other authors are convinced they cold change their mind. 

## Acceptance of a security indicator

If at least 2 authors have labelled twice a instance of the same keyword to be relevant, it is considered in the final set of security indicators.

We obtained a fleiß kappa score of 73.5, resulting in an acceptance of 89 security indicators as a final set.