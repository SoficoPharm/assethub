import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeesList } from './employees-list';

describe('EmployeesList', () => {
  let component: EmployeesList;
  let fixture: ComponentFixture<EmployeesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeesList],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeesList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
