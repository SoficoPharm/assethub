import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentHistory } from './assignment-history';

describe('AssignmentHistory', () => {
  let component: AssignmentHistory;
  let fixture: ComponentFixture<AssignmentHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignmentHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(AssignmentHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
